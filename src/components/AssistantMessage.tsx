import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantMessageProps {
  content: string;
}

export const AssistantMessage = ({ content }: AssistantMessageProps) => {
  return (
    <div className="assistant-message prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-lg font-semibold text-primary border-l-4 border-primary pl-2 mt-3 mb-2"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-base font-semibold text-primary border-l-3 border-primary pl-2 mt-3 mb-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-sm font-semibold text-primary mt-2 mb-1"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-primary" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="text-muted-foreground" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-2 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-2 ml-5 space-y-1 list-disc" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-2 ml-5 space-y-2 list-decimal" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed marker:text-accent marker:font-bold" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary bg-primary/5 pl-4 py-2 my-2 rounded-r-lg"
              {...props}
            />
          ),
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code
                className="bg-accent/30 text-accent-foreground px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              />
            ) : (
              <code
                className="block bg-accent/30 text-accent-foreground p-3 rounded-lg my-2 text-xs font-mono overflow-x-auto"
                {...props}
              />
            ),
          a: ({ node, ...props }) => (
            <a
              className="text-primary underline hover:text-primary/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
