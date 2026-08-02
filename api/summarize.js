const { callDeepSeek } = require("./_deepseek.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { transcript, topic, mode } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "transcript is required" });
    }

    const modeLabel = mode === "interview" ? "面试" : "学习";
    const topicLabel = topic || "未指定主题";

    const prompt = `你是一个专业助手。以下是用户上传的一段${modeLabel}录音的文字稿（主题：${topicLabel}）。

请根据这段文字稿，生成以下内容：

1. **摘要总结**（2-3句话概括核心内容）
2. **待办事项**（提取出需要跟进的行动项，每项一行，格式：- [ ] 事项内容）
3. **关键纪要**（按要点列出讨论的关键信息）

录音文字稿：
"""
${transcript}
"""

请用中文回复，格式如下：
<summary>
摘要内容
</summary>
<todos>
- [ ] 待办1
- [ ] 待办2
</todos>
<notes>
1. 要点1
2. 要点2
</notes>`;

    const content = await callDeepSeek([
      { role: "system", content: "你是一个专业的工作助手，擅长从录音文字稿中提取关键信息、生成待办和纪要。回复使用中文。" },
      { role: "user", content: prompt },
    ], { temperature: 0.3, max_tokens: 1500 });

    let summary = "";
    let todos = "";
    let notes = "";

    const summaryMatch = content.match(/<summary>([\s\S]*?)<\/summary>/);
    const todosMatch = content.match(/<todos>([\s\S]*?)<\/todos>/);
    const notesMatch = content.match(/<notes>([\s\S]*?)<\/notes>/);

    if (summaryMatch) summary = summaryMatch[1].trim();
    if (todosMatch) todos = todosMatch[1].trim();
    if (notesMatch) notes = notesMatch[1].trim();

    if (!summary && !todos) {
      summary = content;
    }

    res.json({ summary, todos, notes, raw: content });
  } catch (err) {
    console.error("Summarize error:", err);
    res.status(500).json({ error: err.message || "Failed to generate summary" });
  }
};
