import React from 'react';
import { Text, View } from '@react-pdf/renderer';

// Leaf component for text formatting in PDF
const PDFLeaf = ({ children, leaf }) => {
    let styledText = children;

    if (leaf.bold) {
        styledText = <Text style={{ fontWeight: 'bold' }}>{styledText}</Text>;
    }

    if (leaf.italic) {
        styledText = <Text style={{ fontStyle: 'italic' }}>{styledText}</Text>;
    }

    if (leaf.underline) {
        styledText = <Text style={{ textDecoration: 'underline' }}>{styledText}</Text>;
    }

    return styledText;
};

// Element component for block formatting in PDF
const PDFElement = ({ children, element }) => {
    const style = { marginBottom: 8 };

    if (element.type === 'center') {
        style.textAlign = 'center';
    } else if (element.type === 'right') {
        style.textAlign = 'right';
    } else {
        style.textAlign = 'left';
    }

    return (
        <Text style={style}>
            {children}
        </Text>
    );
};

const PDFSlateRenderer = ({ value }) => {
    if (!value) return null;

    let content;
    try {
        content = JSON.parse(value);
    } catch {
        // If it's not JSON, treat as plain text
        return <Text>{value}</Text>;
    }

    return (
        <View>
            {content.map((node, index) => {
                if (node.type === 'paragraph') {
                    return (
                        <Text key={index} style={{ textAlign: node.align || 'left', marginBottom: 8 }}>
                            {node.children.map((child, childIndex) => (
                                <PDFLeaf key={childIndex} leaf={child}>
                                    {child.text}
                                </PDFLeaf>
                            ))}
                        </Text>
                    );
                }
                return (
                    <PDFElement key={index} element={node}>
                        {node.children.map((child, childIndex) => (
                            <PDFLeaf key={childIndex} leaf={child}>
                                {child.text}
                            </PDFLeaf>
                        ))}
                    </PDFElement>
                );
            })}
        </View>
    );
};

export default PDFSlateRenderer;
