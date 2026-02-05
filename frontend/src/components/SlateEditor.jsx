import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, Editor, Transforms, Text } from 'slate';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { withHistory } from 'slate-history';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

// Custom helpers for formatting
const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
        match: n => n.type === format,
    });
    return !!match;
};

const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format);
    Transforms.setNodes(
        editor,
        { type: isActive ? 'paragraph' : format },
        { match: n => Editor.isBlock(editor, n) }
    );
};

// Toolbar Button Component
const ToolbarButton = ({ format, icon: Icon, onMouseDown }) => {
    const editor = useSlate();
    const isActive = format === 'bold' || format === 'italic' || format === 'underline'
        ? isMarkActive(editor, format)
        : isBlockActive(editor, format);

    return (
        <button
            type="button"
            className={`p-1 rounded ${isActive ? 'bg-blue-200' : 'hover:bg-gray-100'}`}
            onMouseDown={onMouseDown}
        >
            <Icon size={16} />
        </button>
    );
};

// Toolbar Component
const Toolbar = () => {
    const editor = useSlate();

    const handleMarkClick = useCallback((format) => (event) => {
        event.preventDefault();
        toggleMark(editor, format);
    }, [editor]);

    const handleBlockClick = useCallback((format) => (event) => {
        event.preventDefault();
        toggleBlock(editor, format);
    }, [editor]);

    return (
        <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50">
            <ToolbarButton
                format="bold"
                icon={Bold}
                onMouseDown={handleMarkClick('bold')}
            />
            <ToolbarButton
                format="italic"
                icon={Italic}
                onMouseDown={handleMarkClick('italic')}
            />
            <ToolbarButton
                format="underline"
                icon={Underline}
                onMouseDown={handleMarkClick('underline')}
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <ToolbarButton
                format="left"
                icon={AlignLeft}
                onMouseDown={handleBlockClick('left')}
            />
            <ToolbarButton
                format="center"
                icon={AlignCenter}
                onMouseDown={handleBlockClick('center')}
            />
            <ToolbarButton
                format="right"
                icon={AlignRight}
                onMouseDown={handleBlockClick('right')}
            />
        </div>
    );
};

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

const SlateEditor = ({ value, onChange, placeholder = "Enter text..." }) => {
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);

    // Convert string value to Slate format
    const initialValue = useMemo(() => {
        if (!value) return [{ type: 'paragraph', children: [{ text: '' }] }];
        try {
            return JSON.parse(value);
        } catch {
            return [{ type: 'paragraph', children: [{ text: value }] }];
        }
    }, [value]);

    const [editorValue, setEditorValue] = useState(initialValue);

    const handleChange = (newValue) => {
        setEditorValue(newValue);
        // Convert Slate format to string for form state
        onChange(JSON.stringify(newValue));
    };

    const renderLeaf = useCallback(props => <Leaf {...props} />, []);
    const renderElement = useCallback(props => <Element {...props} />, []);

    return (
        <div className="border border-gray-200 rounded">
            <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
                <Toolbar />
                <Editable
                    renderLeaf={renderLeaf}
                    renderElement={renderElement}
                    placeholder={placeholder}
                    className="p-3 min-h-[100px] outline-none"
                    style={{ minHeight: '100px' }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                        }
                    }}
                />
            </Slate>
        </div>
    );
};

export default SlateEditor;
