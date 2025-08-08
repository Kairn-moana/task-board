// 清理脚本 - 移除开发时的console.log语句
const fs = require("fs");
const path = require("path");

// 需要清理的目录
const directoriesToClean = ["./task-board-react-frontend/src", "./server"];

// 需要跳过的文件和目录
const skipPatterns = ["node_modules", ".git", "dist", "build", ".env"];

// 清理函数
function cleanConsoleLogsinFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let originalContent = content;

    // 移除纯console.log语句（保留带有error、warn等的）
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, "");

    // 移除console.log后的多余空行
    content = content.replace(/\n\s*\n\s*\n/g, "\n\n");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ 清理了文件: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`× 清理文件失败: ${filePath}`, error.message);
    return false;
  }
}

function shouldSkipPath(filePath) {
  return skipPatterns.some((pattern) => filePath.includes(pattern));
}

function cleanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`目录不存在: ${dir}`);
    return;
  }

  let cleanedCount = 0;

  function processDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);

      if (shouldSkipPath(fullPath)) {
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (
        stat.isFile() &&
        (fullPath.endsWith(".js") || fullPath.endsWith(".jsx"))
      ) {
        if (cleanConsoleLogsinFile(fullPath)) {
          cleanedCount++;
        }
      }
    }
  }

  processDirectory(dir);
  console.log(`目录 ${dir} 完成，清理了 ${cleanedCount} 个文件`);
}

// 主执行函数
function main() {
  console.log("开始清理console.log语句...\n");

  for (const dir of directoriesToClean) {
    cleanDirectory(dir);
  }

  console.log("\n✓ 清理完成！");
  console.log("\n注意事项：");
  console.log(
    "- 已保留 console.error, console.warn, console.info 等非debug日志"
  );
  console.log("- 建议在提交前检查清理结果");
  console.log("- 可以使用 git diff 查看更改");
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { cleanConsoleLogsinFile, cleanDirectory };
