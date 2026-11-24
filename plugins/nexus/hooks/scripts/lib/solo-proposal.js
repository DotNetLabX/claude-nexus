'use strict';
const fs = require('fs');
const { handbackText } = require('./step-checkpoint');

const PROPOSAL_LINE = /^Solo proposal for adhoc-[A-Za-z0-9][A-Za-z0-9_-]*:(?=\r?\n|$)/;
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const MAX_TRANSCRIPT_BYTES = 1024 * 1024;

function messageText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const block = content.find(entry => entry?.type === 'text');
  return typeof block?.text === 'string' ? block.text : '';
}

function isSoloProposal(data) {
  let fd;
  try {
    const finalMessage = String(data.last_assistant_message || '');
    const heading = PROPOSAL_LINE.exec(finalMessage)?.[0];
    // The shared reader joins the final text and tool message with one newline.
    const toolMessage = handbackText(data).slice(finalMessage.length + 1);
    const toolProposal = PROPOSAL_LINE.test(toolMessage);
    if (!heading && !toolProposal) return false;
    fd = fs.openSync(data.agent_transcript_path, 'r');
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size === 0 || stat.size > MAX_TRANSCRIPT_BYTES) return false;
    const buf = Buffer.alloc(stat.size + 1);
    if (fs.readSync(fd, buf, 0, buf.length, 0) !== stat.size) return false;

    let lastAssistantText = '';
    for (const line of buf.toString('utf8', 0, stat.size).split('\n')) {
      if (!line.trim()) continue;
      const message = JSON.parse(line)?.message;
      const content = message?.content;
      if (Array.isArray(content) && content.some(block => block?.type === 'tool_use' && EDIT_TOOLS.has(block.name))) {
        return false;
      }
      const text = messageText(content);
      if (message?.role === 'user') {
        if (text.startsWith('Answer:')) return false;
        lastAssistantText = '';
      } else if (message?.role === 'assistant' && text) {
        lastAssistantText = text;
      }
    }
    return toolProposal || Boolean(heading && PROPOSAL_LINE.exec(lastAssistantText)?.[0] === heading);
  } catch {
    return false;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* ignore */ }
  }
}

module.exports = { isSoloProposal };
