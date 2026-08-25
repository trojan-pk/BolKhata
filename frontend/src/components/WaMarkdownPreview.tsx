import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACE, TYPE } from '../theme/tokens';

interface Props {
  text: string;
  sampleName?: string;
  sampleAmount?: string;
  sampleStore?: string;
}

/**
  Renders text formatted with WhatsApp Markdown rules inside a realistic
  WhatsApp chat bubble preview.
 */
export const WaMarkdownPreview: React.FC<Props> = ({
  text,
  sampleName = 'Ali Ahmad',
  sampleAmount = '500',
  sampleStore = 'BolKhata Store',
}) => {
  // Replace variables
  const resolved = text
    .replace(/{customer_name}/g, sampleName)
    .replace(/{amount}/g, sampleAmount)
    .replace(/{store_name}/g, sampleStore);

  const lines = resolved.split('\n');

  return (
    <View style={styles.bubble}>
      {lines.map((line, lineIndex) => {

        // 1. Blockquote (> quote)
        if (line.startsWith('>')) {
          const content = line.slice(1).trim();
          return (
            <View key={lineIndex} style={styles.quoteBlock}>
              <View style={styles.quoteBar} />
              <View style={styles.quoteContent}>
                {renderInlineMarkdown(content)}
              </View>
            </View>
          );
        }

        // 2. List item (- item or 1. item)
        const isBullet = line.trim().startsWith('-');
        const isNumbered = /^\d+\./.test(line.trim());

        if (isBullet || isNumbered) {
          return (
            <View key={lineIndex} style={styles.listRow}>
              <Text style={styles.listBullet}>
                {isBullet ? '•' : line.trim().split('.')[0] + '.'}
              </Text>
              <Text style={styles.lineText}>
                {renderInlineMarkdown(line.trim().replace(/^(-\s*|\d+\.\s*)/, ''))}
              </Text>
            </View>
          );
        }

        // 3. Regular line
        return (
          <View key={lineIndex} style={styles.lineRow}>
            {line === '' ? (
              <Text style={styles.emptyLine}> </Text>
            ) : (
              <Text style={styles.lineText}>{renderInlineMarkdown(line)}</Text>
            )}
          </View>
        );
      })}

      <Text style={styles.timestamp}>
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
      </Text>
    </View>
  );
};

// Parses *bold*, _italic_, ~strike~, `mono`
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex splitting by markdown tokens
  const regex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={idx} style={styles.bold}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <Text key={idx} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return (
        <Text key={idx} style={styles.strike}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text key={idx} style={styles.mono}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={idx}>{part}</Text>;
  });
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: '#E7FCE3', // WhatsApp chat bubble green
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: 2,
    padding: SPACE.md,
    maxWidth: 340,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DCF8C6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  lineRow: {
    minHeight: 20,
  },
  emptyLine: {
    fontSize: 8,
    lineHeight: 8,
  },
  lineText: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#111B21',
  },
  bold: {
    fontWeight: '700',
    color: '#000000',
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  mono: {
    fontFamily: 'monospace',
    backgroundColor: '#D9FDD3',
    paddingHorizontal: 4,
    borderRadius: 3,
    fontSize: 13,
  },
  quoteBlock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
    borderRadius: RADIUS.xs,
    marginVertical: 4,
    paddingRight: 6,
    overflow: 'hidden',
  },
  quoteBar: {
    width: 4,
    backgroundColor: '#128C7E',
  },
  quoteContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 1,
  },
  listBullet: {
    fontWeight: '700',
    color: '#128C7E',
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: '#667781',
    alignSelf: 'flex-end',
    marginTop: 4,
    fontWeight: '600',
  },
});
