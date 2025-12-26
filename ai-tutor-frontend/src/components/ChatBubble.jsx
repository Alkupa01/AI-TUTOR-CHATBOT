import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

function parseLatex(text) {
  if (!text || typeof text !== 'string') return text;
  // Block: $$...$$
  const blockRegex = /\$\$([^\$]+)\$\$/g;
  // Inline: $...$
  const inlineRegex = /\$([^\$]+)\$/g;
  let result = [];
  let lastIndex = 0;
  let match;
  // Block first
  while ((match = blockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      // Inline in between
      result.push(...parseInlineLatex(text.substring(lastIndex, match.index)));
    }
    result.push(<BlockMath key={match.index}>{match[1]}</BlockMath>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    result.push(...parseInlineLatex(text.substring(lastIndex)));
  }
  return result;
}
function parseInlineLatex(text) {
  if (!text) return null;
  const parts = text.split(/(\$[^\$]+\$)/);
  return parts.map((part, idx) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={idx}>{part.slice(1, -1)}</InlineMath>;
    }
    return part;
  });
}

export default function ChatBubble({ sender, text, level = "SD" }) {
  const isUser = sender === "user";

  // Custom components untuk react-markdown
  const components = {
    // Table rendering dengan styling yang lebih baik untuk anak-anak
    table: ({ node, children, ...props }) => {
      return (
        <div className="my-4 overflow-x-auto">
          <table 
            className="w-full border-collapse border-2 border-indigo-300 text-sm"
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },
    thead: ({ node, children, ...props }) => (
      <thead className="bg-indigo-200" {...props}>
        {children}
      </thead>
    ),
    th: ({ node, children, ...props }) => (
      <th 
        className="border-2 border-indigo-300 px-4 py-2 font-bold text-indigo-900 text-center"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ node, children, ...props }) => (
      <td 
        className="border-2 border-indigo-300 px-4 py-2 text-center"
        {...props}
      >
        {children}
      </td>
    ),
    tbody: ({ node, children, ...props }) => {
      // Alternate row colors untuk SD level
      const rows = children.filter(child => child?.type?.name === 'tr' || child?.type === 'tr');
      return (
        <tbody {...props}>
          {rows.map((row, idx) => (
            <tr 
              key={idx}
              className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}
            >
              {row.props.children}
            </tr>
          ))}
        </tbody>
      );
    },
    // Heading styling
    h1: ({ node, children, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-800" {...props}>{children}</h1>,
    h2: ({ node, children, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-gray-800" {...props}>{children}</h2>,
    h3: ({ node, children, ...props }) => <h3 className="text-base font-bold mt-2 mb-1 text-gray-800" {...props}>{children}</h3>,
    // Paragraph
    p: ({ node, children, ...props }) => <p className="mb-2 leading-relaxed" {...props}>{children}</p>,
    // Code inline (untuk LaTeX atau code)
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      // Jika ada language class, render sebagai code block
      if (!inline && match) {
        return (
          <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2">
            <code className={className} {...props}>{children}</code>
          </pre>
        );
      }
      // Inline code
      return (
        <code className="bg-indigo-100 px-2 py-1 rounded text-indigo-900 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    // List styling
    ul: ({ node, children, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props}>{children}</ul>,
    ol: ({ node, children, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props}>{children}</ol>,
    li: ({ node, children, ...props }) => <li className="ml-2" {...props}>{children}</li>,
  };

  // Fungsi fixMarkdownTable tetap

  // Custom paragraph renderer untuk parse LaTeX di dalam markdown
  const enhancedComponents = {
    ...components,
    p: ({ children }) => <p className="mb-2 leading-relaxed">{parseLatex(children.join ? children.join('') : children)}</p>,
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          px-4 py-3 max-w-[75%] rounded-2xl shadow 
          ${isUser
            ? "bg-indigo-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"}
        `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={enhancedComponents}
          className="prose prose-sm"
        >
          {fixMarkdownTable(text)}
        </ReactMarkdown>
      </div>
    </div>
  );
}
