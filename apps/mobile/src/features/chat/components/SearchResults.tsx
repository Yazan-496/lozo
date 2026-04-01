import { SectionList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '../../../shared/components/Avatar';
import { useThemeColors } from '../../../shared/hooks/useThemeColors';
import type { SearchResult } from '../../../shared/types';

interface Props {
    results: SearchResult[];
    query: string;
    onSelect: (result: SearchResult) => void;
}

interface Section {
    title: string;
    avatar: string | null;
    data: SearchResult[];
}

/** Renders bold/normal segments around **marked** text from FTS5 snippet(). */
function HighlightedText({ text, style }: { text: string; style: any }) {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
        <Text style={style} numberOfLines={2}>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <Text key={i} style={{ fontWeight: '700' }}>
                        {part}
                    </Text>
                ) : (
                    part
                ),
            )}
        </Text>
    );
}

export function SearchResults({ results, query, onSelect }: Props) {
    const colors = useThemeColors();

    // Defensive dedupe: FTS can occasionally surface duplicate message IDs.
    const uniqueResults = Array.from(new Map(results.map((r) => [r.messageId, r])).values());

    if (uniqueResults.length === 0 && query.trim().length >= 3) {
        return (
            <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.gray400 }]}>
                    No results for "{query}"
                </Text>
            </View>
        );
    }

    // Group by conversationId
    const sectionMap: Record<string, Section> = {};
    for (const r of uniqueResults) {
        if (!sectionMap[r.conversationId]) {
            sectionMap[r.conversationId] = {
                title: r.conversationName || 'Unknown',
                avatar: r.conversationAvatar,
                data: [],
            };
        }
        sectionMap[r.conversationId].data.push(r);
    }
    const sections = Object.values(sectionMap);

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.conversationId}:${item.messageId}:${item.createdAt}`}
            renderSectionHeader={({ section }) => (
                <View style={[styles.sectionHeader, { backgroundColor: colors.bgSecondary }]}>
                    <Avatar
                        uri={section.avatar}
                        name={section.title}
                        color={colors.primary}
                        size={24}
                    />
                    <Text style={[styles.sectionTitle, { color: colors.dark }]} numberOfLines={1}>
                        {section.title}
                    </Text>
                </View>
            )}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={[styles.resultRow, { borderBottomColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={() => onSelect(item)}
                >
                    <HighlightedText
                        text={item.highlight || item.content}
                        style={[styles.resultText, { color: colors.dark }]}
                    />
                    <Text style={[styles.resultDate, { color: colors.gray400 }]}>
                        {new Date(item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                        })}
                    </Text>
                </TouchableOpacity>
            )}
            stickySectionHeadersEnabled={false}
        />
    );
}

const styles = StyleSheet.create({
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 8,
    },
    sectionTitle: {
        fontWeight: '600',
        fontSize: 14,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 8,
    },
    resultText: {
        flex: 1,
        fontSize: 14,
    },
    resultDate: {
        fontSize: 12,
        flexShrink: 0,
    },
});
