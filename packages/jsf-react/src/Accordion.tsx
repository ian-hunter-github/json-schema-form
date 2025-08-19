import React, { useState } from "react";

interface AccordionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  defaultExpanded = true,
  children,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`jsf-accordion ${className}`}>
      <button
        type="button"
        className="jsf-accordion-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span
          className="jsf-accordion-icon"
          dangerouslySetInnerHTML={{
            __html: isExpanded ? "&#9658;" : "&#9660;",
          }}
        />
        <span className="jsf-accordion-title"> {title} X</span>
      </button>
      <div className="jsf-accordion-content" hidden={!isExpanded}>
        {children}
      </div>
    </div>
  );
};
