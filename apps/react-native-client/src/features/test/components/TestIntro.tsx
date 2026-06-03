import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Image,
    Dimensions
} from "react-native";
import { ArrowLeft, HelpCircle, FileText, Clock, TrendingUp, Sparkles } from "lucide-react-native";

interface Props {
    onStart: () => void;
    onBack: () => void;
}

export default function TestIntro({ onStart, onBack }: Props) {
    return (
        <View style={styles.container}>
            {/* Header bar */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={20} color="#1A202C" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Kiểm tra Chủ đề 1</Text>

                <TouchableOpacity
                    style={styles.helpButton}
                    activeOpacity={0.7}
                >
                    <HelpCircle size={20} color="#718096" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Illustration */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require("../../../../assets/images/a.png")}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Details Section */}
                <View style={styles.detailsCard}>
                    <Text style={styles.title}>Sử học và đời sống</Text>
                    <Text style={styles.subtitle}>
                        Kiểm tra khả năng ghi nhớ và vận dụng kiến thức của bạn về hiện thực lịch sử.
                    </Text>

                    {/* 2x2 Info Grid */}
                    <View style={styles.gridContainer}>
                        {/* 20 Questions */}
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, styles.blueBg]}>
                                <FileText size={20} color="#3182CE" />
                            </View>
                            <Text style={styles.gridText}>20 câu hỏi</Text>
                        </View>

                        {/* ~15 Minutes */}
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, styles.indigoBg]}>
                                <Clock size={20} color="#5D45F9" />
                            </View>
                            <Text style={styles.gridText}>~15 phút</Text>
                        </View>

                        {/* Medium Difficulty */}
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, styles.tealBg]}>
                                <TrendingUp size={20} color="#319795" />
                            </View>
                            <Text style={styles.gridText}>Độ khó: TB</Text>
                        </View>

                        {/* XP Rewards */}
                        <View style={styles.gridItem}>
                            <View style={[styles.iconWrapper, styles.purpleBg]}>
                                <Sparkles size={20} color="#805AD5" />
                            </View>
                            <Text style={styles.gridText}>+50 XP</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={onStart}
                    activeOpacity={0.85}
                >
                    <Text style={styles.startButtonText}>Bắt đầu làm bài</Text>
                    <Text style={styles.arrowIcon}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.laterButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.laterButtonText}>Để sau</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7FAFC",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EDF2F7",
    },
    backButton: {
        padding: 8,
        borderRadius: 100,
        backgroundColor: "#F7FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1A202C",
        textAlign: "center",
        flex: 1,
    },
    helpButton: {
        padding: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageContainer: {
        width: screenWidth,
        height: screenWidth * 0.9,
        maxHeight: 360,
        overflow: "hidden",
        backgroundColor: "#E2E8F0",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    detailsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        padding: 24,
        marginHorizontal: 20,
        marginTop: -32,
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#2C2A7B",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: "#718096",
        textAlign: "center",
        lineHeight: 19,
        fontWeight: "600",
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    gridItem: {
        width: "48%",
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#EDF2F7",
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    blueBg: {
        backgroundColor: "#EBF8FF",
    },
    indigoBg: {
        backgroundColor: "#F5F3FF",
    },
    tealBg: {
        backgroundColor: "#E6FFFA",
    },
    purpleBg: {
        backgroundColor: "#FAF5FF",
    },
    gridText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#4A5568",
        textAlign: "center",
    },
    footer: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EDF2F7",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#5D45F9",
        borderRadius: 100,
        height: 56,
        width: "100%",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 12,
    },
    startButtonText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    arrowIcon: {
        fontSize: 14,
        color: "#FFFFFF",
        fontWeight: "800",
    },
    laterButton: {
        alignItems: "center",
        justifyContent: "center",
        height: 40,
    },
    laterButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#718096",
    },
});
