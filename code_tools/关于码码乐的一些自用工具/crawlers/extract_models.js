const fs = require('fs');

// 读取 JSON 文件
const data = JSON.parse(fs.readFileSync('./api_data/level2_api_response.json', 'utf8'));

let output = '# 所有大模型配置信息\n\n';

// 遍历所有分类
data.items.forEach(category => {
    output += `## ${category.name}\n\n`;

    // 遍历该分类下的所有模型
    category.aiSets.forEach(model => {
        output += `### ${model.name}\n`;
        output += `- **Application ID**: \`${model.id}\`\n`;
        output += `- **Provider**: ${model.providerName}\n`;

        if (model.aiKey) {
            output += `- **API Key**: \`${model.aiKey}\`\n`;
        }

        if (model.apiUrl) {
            output += `- **API URL**: \`${model.apiUrl}\`\n`;
        }

        if (model.extraProperties) {
            const props = model.extraProperties;

            if (props.url) {
                output += `- **URL**: \`${props.url}\`\n`;
            }

            if (props.model) {
                output += `- **Model**: \`${props.model}\`\n`;
            }

            if (props.apiKey && props.apiKey !== model.aiKey) {
                output += `- **Extra API Key**: \`${props.apiKey}\`\n`;
            }

            if (props.maxTokens) {
                output += `- **Max Tokens**: ${props.maxTokens}\n`;
            }

            if (props.isUploadImage !== undefined) {
                output += `- **支持图片上传**: ${props.isUploadImage ? '✅' : '❌'}\n`;
            }

            if (props.isUploadFile !== undefined) {
                output += `- **支持文件上传**: ${props.isUploadFile ? '✅' : '❌'}\n`;
            }

            if (props.isNetSearch !== undefined) {
                output += `- **支持联网搜索**: ${props.isNetSearch ? '✅' : '❌'}\n`;
            }
        }

        if (model.brief) {
            output += `- **简介**: ${model.brief}\n`;
        }

        output += '\n';
    });

    output += '---\n\n';
});

// 写入文件
fs.writeFileSync('./api_data/all_models_config.md', output, 'utf8');
console.log('✅ 已生成 all_models_config.md');
