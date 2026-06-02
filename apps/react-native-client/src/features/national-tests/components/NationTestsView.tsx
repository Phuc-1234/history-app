import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    View,
    useWindowDimensions,
} from "react-native";
import { useNationalTests, NationalTestItem } from "../hooks/useNationTests";

export const NationalTestsView: React.FC = () => {
    const { tests } = useNationalTests();
    const { width } = useWindowDimensions();

    // Calculate clean spacing based on device viewport width
    const paddingHorizontal = 24;
    const gap = 16;
    const totalInternalPadding = paddingHorizontal * 2 + gap * 2;
    const itemSize = (width - totalInternalPadding) / 3;

    const handleTestPress = (item: NationalTestItem) => {
        console.log(`Navigating to test sheet execution context: ${item.id}`);
        // Future router assignment: router.push(`/(6_tests)/test_run/${item.id}`)
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Dynamic Screen Header Text Block */}
            <View style={styles.textHeaderBlock}>
                <Text style={styles.mainHeading}>Đề thi THPT Quốc gia</Text>
                <Text style={styles.subHeading}>
                    Luyện tập với các bộ đề thi THPT các năm
                </Text>
            </View>

            {/* 3-Column Uniform Flexbox Matrix Wrap Grid */}
            <View style={styles.gridContainer}>
                {tests.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => handleTestPress(item)}
                        style={[styles.gridCell, { width: itemSize }]}
                    >
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={[
                                styles.thumbnailImage,
                                { width: itemSize, height: itemSize },
                            ]}
                        />
                        <Text style={styles.cellLabel} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 40,
        backgroundColor: "#FAF8F5", // Matches your clean app core background hue
    },
    textHeaderBlock: {
        marginBottom: 32,
    },
    mainHeading: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1E1E1E",
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    subHeading: {
        fontSize: 14,
        fontWeight: "400",
        color: "#6E6A75",
        lineHeight: 20,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        marginHorizontal: -8, // Compensate cell inner margins
    },
    gridCell: {
        marginHorizontal: 8,
        marginBottom: 24,
        alignItems: "center",
    },
    thumbnailImage: {
        borderRadius: 16,
        backgroundColor: "#EFEBE6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 10,
    },
    cellLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2C2A2E",
        textAlign: "center",
    },
});
