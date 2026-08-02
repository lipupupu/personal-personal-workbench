const { callDeepSeek } = require("./_deepseek.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, paragraph, jd } = req.body;

    if (!paragraph || !jd) {
      return res.status(400).json({ error: "paragraph and jd are required" });
    }

    const prompt = `你是一个求职助手。用户需要根据目标岗位的 JD（职位描述），改写自己的自我介绍段落，使其更贴合岗位要求。

请根据以下信息，改写用户的自我介绍段落：

**原始邮件内容（参考语气和上下文）：**
"""
${email || "（未提供）"}
"""

**当前自我介绍段落：**
"""
${paragraph}
"""

**目标岗位 JD：**
"""
${jd}
"""

改写要求：
1. 保持第一人称，语气诚恳、专业
2. 提取 JD 中的关键要求，在自我介绍中呼应这些要求
3. 基于用户原有内容，不要凭空编造经历
4. 控制在 200-300 字
5. 生成完整的邮件正文（含称呼和结尾）

请直接输出改写后的邮件正文，不要加额外说明。`;

    const content = await callDeepSeek([
      { role: "system", content: "你是一个专业的求职顾问，擅长根据 JD 定制化改写自我介绍和求职邮件。回复使用中文。" },
      { role: "user", content: prompt },
    ], { temperature: 0.5, max_tokens: 800 });

    res.json({ content: content.trim() });
  } catch (err) {
    console.error("JD analyze error:", err);
    res.status(500).json({ error: err.message || "Failed to analyze JD" });
  }
};
