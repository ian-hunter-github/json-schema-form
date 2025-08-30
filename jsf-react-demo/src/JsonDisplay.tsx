import React from 'react';

interface JsonDisplayProps {
  data: any;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const syntaxHighlight = (json: string): React.ReactNode => {
    if (!json) return null;
    
    json = json.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const createMarkup = (json: string) => {
    return { __html: syntaxHighlight(json) || '' };
  };

  return (
    <div className="json-display">
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Form Data (JSON)</h3>
      {data && Object.keys(data).length > 0 ? (
        <pre dangerouslySetInnerHTML={createMarkup(formatJson(data))} />
      ) : (
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          No form data yet. Start filling out the form to see the JSON output.
        </div>
      )}
    </div>
  );
};

export default JsonDisplay;
