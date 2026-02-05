import React from 'react';

// Leaf component for text formatting
const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
};

// Element component for block formatting
const Element = ({ attributes, children, element }) => {
    const style = {};
    if (element.type === 'center') {
        style.textAlign = 'center';
    } else if (element.type === 'right') {
        style.textAlign = 'right';
    } else {
        style.textAlign = 'left';
    }

    return (
        <p style={style} {...attributes}>
            {children}
        </p>
    );
};

const SlateRenderer = ({ value }) => {
    if (!value) return null;

    let content;
    try {
        content = JSON.parse(value);
    } catch {
        // If it's not JSON, treat as plain text
        return <p className="text-gray-700 whitespace-pre-line">{value}</p>;
    }

    return (
        <div className="text-gray-700">
            {content.map((node, index) => {
                if (node.type === 'paragraph') {
                    return (
                        <p key={index} style={{ textAlign: node.align || 'left' }}>
                            {node.children.map((child, childIndex) => (
                                <Leaf key={childIndex} leaf={child}>
                                    {child.text}
                                </Leaf>
                            ))}
                        </p>
                    );
                }
                return (
                    <Element key={index} element={node}>
                        {node.children.map((child, childIndex) => (
                            <Leaf key={childIndex} leaf={child}>
                                {child.text}
                            </Leaf>
                        ))}
                    </Element>
                );
            })}
        </div>
    );
};

export default SlateRenderer;
