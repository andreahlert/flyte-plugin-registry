const content = "from .s3fs.s3fs import AsyncS3FileSystem";
const importRegex = /from\s+(?:\.|flyte(?:kit)?plugins\.)[a-z_.]+\s+import\s+([^#\n]+)/g;
let match;
while ((match = importRegex.exec(content)) !== null) {
  console.log("Match:", match[1]);
}
console.log("Done");
