#!/usr/bin/env python3
"""
Automated discovery and classification of Python libraries
that would benefit from a dedicated Flyte plugin.

Discovers packages via seed lists + GitHub topic search,
fetches metadata from PyPI and GitHub, classifies whether
each package needs a plugin, scores by relevance, and
outputs ranked JSON compatible with the registry wishlist.

Usage:
    python scripts/discover-opportunities.py
    python scripts/discover-opportunities.py --no-cache
    python scripts/discover-opportunities.py --expand    # expand via dependency graph
    python scripts/discover-opportunities.py -v          # verbose logging

Zero external dependencies (stdlib only).
"""

import argparse
import hashlib
import json
import logging
import math
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

SCRIPT_DIR = Path(__file__).parent.resolve()
CONFIG_PATH = SCRIPT_DIR / "discover-config.json"
PLUGINS_PATH = SCRIPT_DIR / ".." / "src" / "data" / "plugins.json"
CANDIDATES_OUTPUT = SCRIPT_DIR / ".." / "src" / "data" / "wishlist-candidates.json"
OPPORTUNITIES_OUTPUT = SCRIPT_DIR / ".." / "src" / "data" / "opportunities.json"

log = logging.getLogger("discover")


# ──────────────────────────────────────────────
# Data classes
# ──────────────────────────────────────────────

@dataclass
class PackageInfo:
    name: str
    display_name: str
    description: str
    version: str
    classifiers: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    home_page: str = ""
    project_urls: dict[str, str] = field(default_factory=dict)
    github_url: Optional[str] = None
    github_stars: Optional[int] = None
    github_topics: list[str] = field(default_factory=list)
    monthly_downloads: int = 0
    weekly_downloads: int = 0
    daily_downloads: int = 0


@dataclass
class Opportunity:
    package_name: str
    name: str
    description: str
    category: str
    plugin_type: str
    plugin_type_reason: str
    score: float
    score_breakdown: dict
    monthly_downloads: int
    weekly_downloads: int
    daily_downloads: int
    github_stars: Optional[int]
    github_url: Optional[str]
    pypi_url: str
    has_existing_plugin: bool
    existing_plugin_slug: Optional[str]
    gap_type: str


# ──────────────────────────────────────────────
# File cache
# ──────────────────────────────────────────────

class FileCache:
    def __init__(self, cache_dir: Path, ttl_hours: int):
        self.cache_dir = cache_dir
        self.ttl_hours = ttl_hours
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        h = hashlib.md5(key.encode()).hexdigest()
        return self.cache_dir / f"{h}.json"

    def get(self, key: str):
        path = self._path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            age_hours = (time.time() - data["ts"]) / 3600
            if age_hours > self.ttl_hours:
                return None
            return data["v"]
        except (json.JSONDecodeError, KeyError):
            return None

    def set(self, key: str, value):
        path = self._path(key)
        path.write_text(json.dumps({"ts": time.time(), "v": value}, default=str))


class NoCache:
    def get(self, key: str):
        return None

    def set(self, key: str, value):
        pass


# ──────────────────────────────────────────────
# Rate limiter
# ──────────────────────────────────────────────

class RateLimiter:
    def __init__(self, min_interval_ms: int):
        self.min_interval = min_interval_ms / 1000.0
        self.last_call = 0.0

    def wait(self):
        elapsed = time.time() - self.last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call = time.time()


# ──────────────────────────────────────────────
# HTTP helpers
# ──────────────────────────────────────────────

def http_get_json(url: str, rate_limiter: Optional[RateLimiter] = None,
                  headers: Optional[dict] = None, timeout: int = 15):
    if rate_limiter:
        rate_limiter.wait()
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "flyte-plugin-discovery/1.0")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError) as e:
        log.debug(f"HTTP error for {url}: {e}")
        return None


# ──────────────────────────────────────────────
# Discovery phase
# ──────────────────────────────────────────────

class Discoverer:
    def __init__(self, config: dict, cache, expand: bool = False):
        self.config = config
        self.cache = cache
        self.expand = expand
        self.pypi_rl = RateLimiter(config["rate_limits"]["pypi_interval_ms"])
        self.pypistats_rl = RateLimiter(config["rate_limits"]["pypistats_interval_ms"])
        self.gh_rl = RateLimiter(config["rate_limits"]["github_interval_ms"])

    def discover(self) -> list[PackageInfo]:
        # Collect all candidate package names with their category
        pkg_categories: dict[str, str] = {}
        for category, names in self.config["seed_packages"].items():
            for name in names:
                pkg_categories.setdefault(name, category)

        # Expand via GitHub topic search
        gh_packages = self._discover_github_topics()
        for name, cat in gh_packages.items():
            pkg_categories.setdefault(name, cat)

        total = len(pkg_categories)
        log.info(f"Discovered {total} candidate packages")

        # Fetch metadata for each
        packages: list[PackageInfo] = []
        for i, (name, category) in enumerate(pkg_categories.items(), 1):
            log.info(f"[{i}/{total}] Fetching {name}...")
            pkg = self._fetch_package(name, category)
            if pkg:
                packages.append(pkg)

                # Dependency expansion
                if self.expand and len(pkg_categories) < 500:
                    for dep in pkg.dependencies[:5]:
                        dep_clean = re.split(r"[<>=\[;!]", dep)[0].strip().lower()
                        if dep_clean and dep_clean not in pkg_categories:
                            pkg_categories[dep_clean] = category

        min_dl = self.config["thresholds"]["min_monthly_downloads"]
        min_stars = self.config["thresholds"]["min_github_stars"]
        before = len(packages)
        packages = [
            p for p in packages
            if p.monthly_downloads >= min_dl or (p.github_stars and p.github_stars >= min_stars)
        ]
        log.info(f"Filtered {before} -> {len(packages)} packages (min {min_dl} downloads or {min_stars} stars)")

        return packages

    def _discover_github_topics(self) -> dict[str, str]:
        """Search GitHub for popular Python repos by ML/data topics."""
        results: dict[str, str] = {}
        topics = self.config.get("github_topics", [])

        for topic in topics:
            cache_key = f"gh-topic:{topic}"
            cached = self.cache.get(cache_key)
            if cached is not None:
                for name, cat in cached.items():
                    results.setdefault(name, cat)
                continue

            log.info(f"  GitHub topic search: {topic}")
            found = {}
            try:
                self.gh_rl.wait()
                proc = subprocess.run(
                    ["gh", "api", f"/search/repositories?q=topic:{topic}+language:python&sort=stars&per_page=30",
                     "--jq", ".items[] | {name: .name, full_name: .full_name}"],
                    capture_output=True, text=True, timeout=15
                )
                if proc.returncode == 0 and proc.stdout.strip():
                    # Parse each JSON object (gh outputs one per line)
                    for line in proc.stdout.strip().split("\n"):
                        try:
                            item = json.loads(line)
                            pkg_name = item["name"].lower().replace("_", "-")
                            # Map topic to category
                            cat = self._topic_to_category(topic)
                            found[pkg_name] = cat
                        except (json.JSONDecodeError, KeyError):
                            continue
            except (subprocess.TimeoutExpired, FileNotFoundError):
                log.debug(f"gh CLI not available or timeout for topic {topic}")

            self.cache.set(cache_key, found)
            for name, cat in found.items():
                results.setdefault(name, cat)

        log.info(f"  GitHub topics added {len(results)} candidates")
        return results

    def _topic_to_category(self, topic: str) -> str:
        mapping = {
            "machine-learning": "ml-training",
            "deep-learning": "ml-training",
            "natural-language-processing": "ml-training",
            "computer-vision": "ml-training",
            "reinforcement-learning": "ml-training",
            "mlops": "experiment-tracking",
            "experiment-tracking": "experiment-tracking",
            "data-engineering": "databases-warehouses",
            "data-science": "data-dataframe",
            "model-serving": "model-serving",
            "feature-store": "data-dataframe",
            "data-validation": "data-validation",
            "workflow-orchestration": "workflow",
            "vector-database": "databases-warehouses",
            "llm": "ml-training",
        }
        return mapping.get(topic, "developer-tools")

    def _fetch_package(self, name: str, category: str) -> Optional[PackageInfo]:
        """Fetch PyPI metadata + downloads + GitHub info for a package."""
        # PyPI metadata
        pypi_data = self._fetch_pypi(name)
        if not pypi_data:
            return None

        info = pypi_data.get("info", {})

        # Extract dependencies
        deps = []
        requires_dist = info.get("requires_dist") or []
        for req in requires_dist:
            dep_name = re.split(r"[<>=\[;!\s]", req)[0].strip().lower()
            if dep_name:
                deps.append(dep_name)

        # Find GitHub URL
        github_url = self._extract_github_url(info)

        # Fetch download stats
        downloads = self._fetch_downloads(name)

        # Fetch GitHub info
        stars = None
        topics = []
        if github_url:
            stars, topics = self._fetch_github_info(github_url)

        display_name = info.get("name", name)
        # Capitalize nicely
        if display_name == display_name.lower():
            display_name = display_name.replace("-", " ").title()

        return PackageInfo(
            name=name,
            display_name=display_name,
            description=(info.get("summary") or "")[:200],
            version=info.get("version", ""),
            classifiers=info.get("classifiers") or [],
            keywords=[k.strip().lower() for k in (info.get("keywords") or "").split(",") if k.strip()],
            dependencies=deps,
            home_page=info.get("home_page") or "",
            project_urls=info.get("project_urls") or {},
            github_url=github_url,
            github_stars=stars,
            github_topics=topics,
            monthly_downloads=downloads.get("last_month", 0),
            weekly_downloads=downloads.get("last_week", 0),
            daily_downloads=downloads.get("last_day", 0),
        )

    def _fetch_pypi(self, name: str) -> Optional[dict]:
        cache_key = f"pypi:{name}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = http_get_json(f"https://pypi.org/pypi/{name}/json", self.pypi_rl)
        if data:
            self.cache.set(cache_key, data)
        return data

    def _fetch_downloads(self, name: str) -> dict:
        cache_key = f"pypistats:{name}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        data = http_get_json(f"https://pypistats.org/api/packages/{name}/recent", self.pypistats_rl)
        result = {}
        if data and "data" in data:
            result = {
                "last_day": data["data"].get("last_day", 0),
                "last_week": data["data"].get("last_week", 0),
                "last_month": data["data"].get("last_month", 0),
            }
        self.cache.set(cache_key, result)
        return result

    def _fetch_github_info(self, github_url: str) -> tuple[Optional[int], list[str]]:
        match = re.match(r"https://github\.com/([^/]+/[^/]+)", github_url)
        if not match:
            return None, []
        repo = match.group(1).rstrip("/")
        cache_key = f"gh:{repo}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached.get("stars"), cached.get("topics", [])

        try:
            self.gh_rl.wait()
            proc = subprocess.run(
                ["gh", "api", f"repos/{repo}",
                 "--jq", "{stars: .stargazers_count, topics: .topics}"],
                capture_output=True, text=True, timeout=15
            )
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                result = {"stars": data.get("stars"), "topics": data.get("topics", [])}
                self.cache.set(cache_key, result)
                return result["stars"], result["topics"]
        except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError):
            pass

        self.cache.set(cache_key, {"stars": None, "topics": []})
        return None, []

    def _extract_github_url(self, info: dict) -> Optional[str]:
        urls = info.get("project_urls") or {}
        for key in ["Source", "Source Code", "Repository", "GitHub", "Homepage", "Code"]:
            url = urls.get(key, "")
            if "github.com" in url:
                return url.rstrip("/")
        home = info.get("home_page") or ""
        if "github.com" in home:
            return home.rstrip("/")
        return None


# ──────────────────────────────────────────────
# Scoring phase
# ──────────────────────────────────────────────

class Scorer:
    def __init__(self, config: dict):
        self.weights = config["scoring"]

    def score(self, pkg: PackageInfo) -> tuple[float, dict]:
        dl_score = self._log_norm(pkg.monthly_downloads, 5_000, 200_000_000)
        star_score = self._log_norm(pkg.github_stars or 0, 50, 80_000)

        # Growth: weekly vs monthly ratio (healthy ~0.25, growing >0.3)
        if pkg.monthly_downloads > 0:
            weekly_ratio = pkg.weekly_downloads / pkg.monthly_downloads
            growth_score = min(100, max(0, (weekly_ratio - 0.2) * 500))
        else:
            growth_score = 0

        # Ecosystem relevance: ML/data keywords in classifiers and topics
        relevance_score = self._relevance(pkg)

        breakdown = {
            "downloads": round(dl_score, 1),
            "stars": round(star_score, 1),
            "growth": round(growth_score, 1),
            "relevance": round(relevance_score, 1),
        }

        composite = (
            dl_score * self.weights["monthly_downloads_weight"]
            + star_score * self.weights["github_stars_weight"]
            + growth_score * self.weights["growth_rate_weight"]
            + relevance_score * self.weights["ecosystem_relevance_weight"]
        )

        return round(composite, 1), breakdown

    def _log_norm(self, value: int, floor: int, ceiling: int) -> float:
        if value <= floor:
            return 0.0
        if value >= ceiling:
            return 100.0
        return (math.log(value) - math.log(floor)) / (math.log(ceiling) - math.log(floor)) * 100

    def _relevance(self, pkg: PackageInfo) -> float:
        ml_keywords = {
            "machine learning", "deep learning", "neural network", "data science",
            "artificial intelligence", "nlp", "computer vision", "pytorch",
            "tensorflow", "model", "training", "inference", "pipeline",
            "workflow", "orchestration", "data engineering", "mlops",
            "experiment", "feature", "dataframe", "pandas", "spark",
        }
        text = " ".join(
            pkg.classifiers + pkg.keywords + pkg.github_topics + [pkg.description.lower()]
        ).lower()
        hits = sum(1 for kw in ml_keywords if kw in text)
        return min(100, hits * 12)


# ──────────────────────────────────────────────
# Classification phase
# ──────────────────────────────────────────────

OVERRIDE_REASONS = {
    "connector": "Manual override: external service connector (database, cloud, API)",
    "type_handler": "Manual override: defines custom data types that benefit from Flyte type handlers",
    "deck_renderer": "Manual override: produces visual output suitable for FlyteDecks rendering",
    "task_type": "Manual override: manages external compute or serving infrastructure",
    "no_plugin": "Manual override: computation library, works inside @task without a dedicated plugin",
}


class Classifier:
    def __init__(self, config: dict):
        self.signals = config["classification_signals"]
        # Build override lookup: package_name -> plugin_type
        self.overrides: dict[str, str] = {}
        for ptype, packages in config.get("overrides", {}).items():
            for pkg_name in packages:
                self.overrides[pkg_name] = ptype

    def classify(self, pkg: PackageInfo) -> tuple[str, str]:
        # Check manual overrides first (highest priority)
        if pkg.name in self.overrides:
            ptype = self.overrides[pkg.name]
            return ptype, OVERRIDE_REASONS.get(ptype, f"Manual override: {ptype}")

        # Heuristic-based classification
        scores: dict[str, tuple[int, list[str]]] = {}

        for ptype, signals in self.signals.items():
            score = 0
            reasons: list[str] = []

            # Check dependencies (only count unique matches, cap at 2 dep hits per type)
            dep_hits = 0
            for dep in pkg.dependencies:
                if dep_hits >= 2:
                    break
                for pattern in signals.get("dependencies", []):
                    if pattern.endswith("-"):
                        if dep.startswith(pattern):
                            score += 3
                            reasons.append(f"dep:{dep}")
                            dep_hits += 1
                            break
                    elif dep == pattern:
                        score += 3
                        reasons.append(f"dep:{dep}")
                        dep_hits += 1
                        break

            # Check classifiers
            classifiers_text = " ".join(pkg.classifiers).lower()
            for kw in signals.get("classifiers_keywords", []):
                if kw.lower() in classifiers_text:
                    score += 2
                    reasons.append(f"classifier:{kw}")

            # Check description keywords (use whole-phrase matching)
            desc = pkg.description.lower()
            for kw in signals.get("description_keywords", []):
                if kw.lower() in desc:
                    score += 2
                    reasons.append(f"desc:{kw}")

            scores[ptype] = (score, reasons)

        # Pick best non-no_plugin type
        best_type = "no_plugin"
        best_score = 0
        best_reasons: list[str] = []

        for ptype, (sc, rs) in scores.items():
            if ptype == "no_plugin":
                continue
            if sc > best_score:
                best_score = sc
                best_type = ptype
                best_reasons = rs

        # Require a higher threshold to avoid false positives
        if best_score < 4:
            return "no_plugin", "Computation library, works inside @task without a dedicated plugin"

        return best_type, "; ".join(best_reasons[:5])


# ──────────────────────────────────────────────
# Gap analysis phase
# ──────────────────────────────────────────────

class GapAnalyzer:
    def __init__(self, plugins_path: Path):
        if plugins_path.exists():
            plugins = json.loads(plugins_path.read_text())
        else:
            plugins = []

        self.plugin_packages = {p["packageName"].lower() for p in plugins}
        self.plugin_deps: dict[str, str] = {}
        for p in plugins:
            for dep in p.get("dependencies", []):
                self.plugin_deps[dep.lower()] = p["slug"]

        self.v2_bases = set()
        self.v1_slugs = set()
        for p in plugins:
            if p.get("sdk") == "flyte-sdk":
                self.v2_bases.add(p["slug"].replace("v2-", ""))
            else:
                self.v1_slugs.add(p["slug"])

    def analyze(self, pkg_name: str) -> tuple[bool, Optional[str], str]:
        """Returns (has_existing, existing_slug, gap_type)."""
        name_lower = pkg_name.lower()

        # Direct package match
        for prefix in ["flytekitplugins-", "flyteplugins-", ""]:
            candidate = f"{prefix}{name_lower}"
            if candidate in self.plugin_packages:
                slug = name_lower
                if slug in self.v2_bases:
                    return True, slug, "already-covered"
                elif slug in self.v1_slugs:
                    return True, slug, "needs-v2-port"
                return True, slug, "already-covered"

        # Dependency match
        if name_lower in self.plugin_deps:
            slug = self.plugin_deps[name_lower]
            return True, slug, "already-covered"

        return False, None, "no-plugin"


# ──────────────────────────────────────────────
# Output
# ──────────────────────────────────────────────

VALID_CATEGORIES = {
    "data-dataframe", "databases-warehouses", "cloud-infrastructure",
    "ml-training", "model-serving", "experiment-tracking",
    "data-validation", "workflow", "developer-tools",
}


def write_outputs(opportunities: list[Opportunity]):
    # Full opportunities file
    full = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "totalDiscovered": len(opportunities),
        "opportunities": [asdict(o) for o in opportunities],
    }
    OPPORTUNITIES_OUTPUT.write_text(json.dumps(full, indent=2))
    log.info(f"Wrote {len(opportunities)} opportunities to {OPPORTUNITIES_OUTPUT}")

    # Backward-compatible wishlist-candidates.json
    # Only include packages that need a plugin and don't already have one
    candidates = []
    for o in opportunities:
        if o.gap_type == "no-plugin" and o.plugin_type != "no_plugin":
            candidates.append({
                "packageName": o.package_name,
                "name": o.name,
                "description": o.description,
                "category": o.category,
                "githubUrl": o.github_url,
            })

    output = {"candidates": candidates}
    CANDIDATES_OUTPUT.write_text(json.dumps(output, indent=2))
    log.info(f"Wrote {len(candidates)} candidates to {CANDIDATES_OUTPUT}")


def print_summary(opportunities: list[Opportunity]):
    print("\n" + "=" * 80)
    print("FLYTE PLUGIN OPPORTUNITY REPORT")
    print(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 80)

    # Stats
    by_type = {}
    by_gap = {}
    for o in opportunities:
        by_type[o.plugin_type] = by_type.get(o.plugin_type, 0) + 1
        by_gap[o.gap_type] = by_gap.get(o.gap_type, 0) + 1

    print(f"\nTotal packages analyzed: {len(opportunities)}")
    print(f"\nBy plugin type needed:")
    for ptype, count in sorted(by_type.items(), key=lambda x: -x[1]):
        label = {
            "connector": "Connector (external I/O)",
            "type_handler": "Type Handler (custom data types)",
            "deck_renderer": "Deck Renderer (visualization)",
            "task_type": "Task Type (external compute)",
            "no_plugin": "No plugin needed (use in @task)",
        }.get(ptype, ptype)
        print(f"  {label}: {count}")

    print(f"\nBy gap status:")
    for gap, count in sorted(by_gap.items(), key=lambda x: -x[1]):
        print(f"  {gap}: {count}")

    # Top opportunities (needs plugin, no existing)
    top = [o for o in opportunities if o.gap_type == "no-plugin" and o.plugin_type != "no_plugin"]
    if top:
        print(f"\n{'─' * 80}")
        print("TOP NEW PLUGIN OPPORTUNITIES (ranked by score)")
        print(f"{'─' * 80}")
        print(f"{'Score':>6}  {'Downloads':>12}  {'Stars':>7}  {'Type':<14}  {'Package'}")
        print(f"{'─' * 6}  {'─' * 12}  {'─' * 7}  {'─' * 14}  {'─' * 30}")
        for o in top[:30]:
            stars = f"{o.github_stars:,}" if o.github_stars else "?"
            dl = f"{o.monthly_downloads:,}"
            print(f"{o.score:>6.1f}  {dl:>12}  {stars:>7}  {o.plugin_type:<14}  {o.name} ({o.package_name})")

    # No-plugin (works in @task)
    no_plugin = [o for o in opportunities if o.plugin_type == "no_plugin"]
    if no_plugin:
        print(f"\n{'─' * 80}")
        print("NO PLUGIN NEEDED (works fine inside @task)")
        print(f"{'─' * 80}")
        for o in sorted(no_plugin, key=lambda x: -x.monthly_downloads)[:15]:
            dl = f"{o.monthly_downloads:,}"
            print(f"  {dl:>12} downloads  {o.name} ({o.package_name})")

    print()


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Discover Flyte plugin opportunities")
    parser.add_argument("--no-cache", action="store_true", help="Ignore cached API responses")
    parser.add_argument("--expand", action="store_true", help="Expand candidates via dependency graph")
    parser.add_argument("--config", type=Path, default=CONFIG_PATH, help="Config file path")
    parser.add_argument("--min-downloads", type=int, help="Override min monthly downloads threshold")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(message)s",
    )

    config = json.loads(args.config.read_text())

    if args.min_downloads:
        config["thresholds"]["min_monthly_downloads"] = args.min_downloads

    cache_cfg = config["cache"]
    cache_dir = SCRIPT_DIR / ".." / cache_cfg["dir"]
    cache = NoCache() if args.no_cache else FileCache(cache_dir, cache_cfg["ttl_hours"])

    # Phase 1: Discover
    log.info("Phase 1: Discovering packages...")
    discoverer = Discoverer(config, cache, expand=args.expand)
    packages = discoverer.discover()

    # Phase 2: Score
    log.info("Phase 2: Scoring...")
    scorer = Scorer(config)

    # Phase 3: Classify
    log.info("Phase 3: Classifying...")
    classifier = Classifier(config)

    # Phase 4: Gap analysis
    log.info("Phase 4: Gap analysis...")
    gap_analyzer = GapAnalyzer(PLUGINS_PATH)

    # Build opportunities
    opportunities: list[Opportunity] = []
    for pkg in packages:
        score, breakdown = scorer.score(pkg)
        plugin_type, reason = classifier.classify(pkg)
        has_existing, existing_slug, gap_type = gap_analyzer.analyze(pkg.name)

        category = None
        # Get category from seed config
        for cat, names in config["seed_packages"].items():
            if pkg.name in names:
                category = cat
                break
        if not category:
            category = "developer-tools"

        # Validate category
        if category not in VALID_CATEGORIES:
            category = "developer-tools"

        opportunities.append(Opportunity(
            package_name=pkg.name,
            name=pkg.display_name,
            description=pkg.description,
            category=category,
            plugin_type=plugin_type,
            plugin_type_reason=reason,
            score=score,
            score_breakdown=breakdown,
            monthly_downloads=pkg.monthly_downloads,
            weekly_downloads=pkg.weekly_downloads,
            daily_downloads=pkg.daily_downloads,
            github_stars=pkg.github_stars,
            github_url=pkg.github_url,
            pypi_url=f"https://pypi.org/project/{pkg.name}/",
            has_existing_plugin=has_existing,
            existing_plugin_slug=existing_slug,
            gap_type=gap_type,
        ))

    # Sort by score descending
    opportunities.sort(key=lambda o: -o.score)

    # Phase 5: Output
    log.info("Phase 5: Writing output...")
    write_outputs(opportunities)
    print_summary(opportunities)


if __name__ == "__main__":
    main()
