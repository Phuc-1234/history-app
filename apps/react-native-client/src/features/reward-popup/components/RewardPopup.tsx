import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { RewardPopupData } from "../types/reward";
import RankHero from "./RankHero";
import RankPathSection from "./RankPathSection";
import RewardListSection from "./RewardListSection";
import XpProgressSection from "./XpProgressSection";

interface RewardPopupProps {
    visible: boolean;
    data: RewardPopupData;
    onClose: () => void;
}

const text = {
    title: "\u0043\u1ea5\u0070\u0020\u0062\u1ead\u0063\u0020\u0063\u1ee7\u0061\u0020\u0062\u1ea1\u006e",
    description:
        "\u0054\u00ed\u0063\u0068\u0020\u006c\u0169\u0079\u0020\u0058\u0050\u0020\u0062\u1eb1\u006e\u0067\u0020\u0063\u00e1\u0063\u0068\u0020\u0068\u1ecdc\u0020\u0062\u00e0\u0069\u0020\u0076\u00e0\u0020\u006c\u00e0\u006d\u0020\u0111\u1ec1\u0020\u0111\u1ec3\u0020\u0074\u0068\u0103\u006e\u0067\u0020\u0068\u1ea1\u006e\u0067\u002e",
};

export default function RewardPopup({
    visible,
    data,
    onClose,
}: RewardPopupProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.title}>{text.title}</Text>
                            <Text style={styles.description}>
                                {text.description}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={8}
                        >
                            <Text style={styles.closeText}>{"\u00d7"}</Text>
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        <RankHero currentRank={data.currentRank} />
                        <XpProgressSection
                            currentXp={data.currentXp}
                            nextRankXp={data.nextRankXp}
                            nextRank={data.nextRank}
                        />
                        <RankPathSection ranks={data.ranks} />
                        <RewardListSection
                            currentRank={data.currentRank}
                            rewards={data.rewards}
                        />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(50, 48, 44, 0.42)",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    dismissArea: { flex: 1, width: "100%" },
    sheet: {
        width: "100%",
        maxWidth: 430,
        maxHeight: "91%",
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: "hidden",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEAF4",
    },
    headerTextWrap: { flex: 1, paddingRight: 16 },
    title: {
        color: "#1D1B18",
        fontSize: 22,
        fontWeight: "700",
        lineHeight: 28,
    },
    description: {
        color: "#474555",
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    closeText: { color: "#474555", fontSize: 30, lineHeight: 32 },
    content: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 34,
        gap: 34,
    },
});
