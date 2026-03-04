const fs = require('fs');

// 读取 JSON 文件
const data = JSON.parse(fs.readFileSync('./api_data/level2_api_response.json', 'utf8'));

let output = '# OpenAI 兼容模型配置信息\n\n';
let count = 0;

// 遍历所有分类
data.items.forEach(category => {
    let categoryOutput = `## ${category.name}\n\n`;
    let categoryCount = 0;

    // 遍历该分类下的所有模型，只保留 OpenAI 兼容的
    category.aiSets.forEach(model => {
        // 过滤掉 Dify 和 Coze
        if (model.providerName === 'Dify' || model.providerName === 'Coze') {
            return;
        }

        // 只保留 OpenAI 兼容的（有 URL 和 model 字段）
        if (!model.extraProperties || !model.extraProperties.url || !model.extraProperties.model) {
            return;
        }

        categoryOutput += `### ${model.name}\n`;
        categoryOutput += `- **Application ID**: \`${model.id}\`\n`;
        categoryOutput += `- **Provider**: OpenAI 兼容\n`;
        categoryOutput += `- **API Key**: \`${model.extraProperties.apiKey || model.aiKey}\`\n`;
        categoryOutput += `- **API URL**: \`${model.extraProperties.url}\`\n`;
        categoryOutput += `- **Model**: \`${model.extraProperties.model}\`\n`;

        if (model.extraProperties.maxTokens) {
            categoryOutput += `- **Max Tokens**: ${model.extraProperties.maxTokens}\n`;
        }

        if (model.extraProperties.isUploadImage !== undefined) {
            categoryOutput += `- **支持图片上传**: ${model.extraProperties.isUploadImage ? '✅' : '❌'}\n`;
        }

        if (model.extraProperties.isUploadFile !== undefined) {
            categoryOutput += `- **支持文件上传**: ${model.extraProperties.isUploadFile ? '✅' : '❌'}\n`;
        }

        if (model.extraProperties.isNetSearch !== undefined) {
            categoryOutput += `- **支持联网搜索**: ${model.extraProperties.isNetSearch ? '✅' : '❌'}\n`;
        }

        if (model.brief) {
            categoryOutput += `- **简介**: ${model.brief}\n`;
        }

        categoryOutput += '\n';
        categoryCount++;
        count++;
    });

    // 只有该分类有模型时才输出
    if (categoryCount > 0) {
        output += categoryOutput;
        output += '---\n\n';
    }
});

output += `\n**总计**: ${count} 个 OpenAI 兼容模型\n`;

// 写入文件
fs.writeFileSync('./api_data/openai_compatible_models.md', output, 'utf8');
console.log(`✅ 已生成 openai_compatible_models.md (共 ${count} 个模型)`);
