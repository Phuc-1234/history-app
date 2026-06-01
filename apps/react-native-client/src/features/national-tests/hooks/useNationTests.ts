import { useState, useEffect } from "react";

export interface NationalTestItem {
    id: string;
    title: string;
    imageUrl: string;
}

export function useNationalTests() {
    const [tests, setTests] = useState<NationalTestItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Simulating instant mock database delivery
        const mockData: NationalTestItem[] = Array.from(
            { length: 9 },
            (_, index) => ({
                id: `thpt-${index + 1}`,
                title: `Đề THPT ${index + 1}`,
                // Alternating colorful placeholders using standard high-quality icons/graphics images
                imageUrl: `https://picsum.photos/id/${10 + index * 5}/150/150`,
            }),
        );

        setTests(mockData);
        setLoading(false);
    }, []);

    return { tests, loading };
}
