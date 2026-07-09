import React, { useState } from "react";
import { ScrollView } from "react-native";
import { EmptyState, ScreenShell, SegmentTabs, UserCard } from "@/components/ui";
import {
    useAcceptFriendRequestMutation,
    useCancelFriendRequestMutation,
    useGetIncomingFriendRequestsQuery,
    useGetOutgoingFriendRequestsQuery,
    useRejectFriendRequestMutation,
} from "../services/socialApi";
import { styles } from "../styles/social.styles";
import { toViewUser } from "../utils/socialView";

type Tab = "Đã nhận" | "Đã gửi";

export function FriendRequestsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("Đã nhận");
    const incomingQuery = useGetIncomingFriendRequestsQuery();
    const outgoingQuery = useGetOutgoingFriendRequestsQuery();
    const [acceptRequest] = useAcceptFriendRequestMutation();
    const [rejectRequest] = useRejectFriendRequestMutation();
    const [cancelRequest] = useCancelFriendRequestMutation();

    const activeQuery = activeTab === "Đã nhận" ? incomingQuery : outgoingQuery;
    const requestUsers = activeQuery.data?.requests ?? [];

    return (
        <ScreenShell title="Lời mời kết bạn">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SegmentTabs
                    tabs={["Đã nhận", "Đã gửi"]}
                    active={activeTab}
                    onChange={(t) => setActiveTab(t as Tab)}
                />
                {activeQuery.isError ? (
                    <EmptyState
                        title="Không tải được lời mời kết bạn."
                        actionLabel="Tải lại"
                        onAction={activeQuery.refetch}
                    />
                ) : null}
                {!activeQuery.isFetching && !activeQuery.isError && requestUsers.length === 0 ? (
                    <EmptyState title="Không có lời mời nào." />
                ) : null}
                {requestUsers.map((request) => {
                    const user = request.user ? toViewUser(request.user) : null;
                    if (!user) return null;
                    return (
                        <UserCard
                            key={request.id}
                            user={user}
                            primaryLabel={activeTab === "Đã nhận" ? "Chấp nhận" : "Huỷ"}
                            primaryIcon={activeTab === "Đã nhận" ? "checkmark" : "close"}
                            primaryVariant="primary"
                            primaryOnPress={() => {
                                if (activeTab === "Đã nhận") {
                                    acceptRequest(request.id);
                                } else {
                                    cancelRequest(request.id);
                                }
                            }}
                            secondaryLabel={activeTab === "Đã nhận" ? "Từ chối" : undefined}
                            secondaryIcon={activeTab === "Đã nhận" ? "close" : undefined}
                            secondaryVariant="primary"
                            secondaryOnPress={() => rejectRequest(request.id)}
                        />
                    );
                })}
            </ScrollView>
        </ScreenShell>
    );
}
