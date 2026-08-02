const { callDeepSeek } = require("./_deepseek.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { qaText, jobInfo } = req.body;

    if (!qaText) {
      return res.status(400).json({ error: "qaText is required" });
    }

    const jobContext = jobInfo ? `（岗位：${jobInfo}）` : "";

    const prompt = `你是一个面试复盘助手。以下是用户记录的面试问答内容${jobContext}。

请对这场面试进行复盘分析，给出以下内容：

1. **整体评分**（0-100 分）
2. **维度评分**（每项 0-100 分）：
   - 表达清晰度
   - 逻辑结构
   - 专业深度
   - 主动提问
3. **改进建议**（2-3 条具体建议）

面试问答记录：
"""
${qaText}
"""

请按以下格式回复：
<score>85</score>
<scores>
表达清晰度:80
逻辑结构:85
专业深度:90
主动提问:70
</scores>
<suggestion>
1. 建议一
2. 建议二
3. 建议三
</suggestion>`;

    const content = await callDeepSeek([
      { role: "system", content: "你是一个专业的面试官和职业教练，擅长面试复盘分析。回复使用中文。" },
      { role: "user", content: prompt },
    ], { temperature: 0.4, max_tokens: 1000 });

    let score = 0;
    let scores = {};
    let suggestion = "";

    const scoreMatch = content.match(/<score>(\d+)<\/score>/);
    const scoresMatch = content.match(/<scores>([\s\S]*?)<\/scores>/);
    const suggestionMatch = content.match(/<suggestion>([\s\S]*?)<\/suggestion>/);

    if (scoreMatch) score = parseInt(scoreMatch[1]);
    if (scoresMatch) {
      const lines = scoresMatch[1].trim().split("\n");
      for (const line of lines) {
        const m = line.match(/(.+?):(\d+)/);
        if (m) scores[m[1].trim()] = parseInt(m[2].trim());
      }
    }
    if (suggestionMatch) suggestion = suggestionMatch[1].trim();

    res.json({ score, scores, suggestion, raw: content });
  } catch (err) {
    console.error("Interview review error:", err);
    res.status(500).json({ error: err.message || "Failed to review interview" });
  }
};
