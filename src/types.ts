export interface Selection {
    id: string;
    category: string;
    label: string;
    description?: string;
}

export interface ProjectOption {
    id: string;
    label: string;
    description?: string;
    rationale?: string;
    icon?: React.ReactNode;
    features?: ProjectOption[];
    exclusive?: boolean;
}

export interface AIModelSettings {
    contextWindow: number;
    maxTokens: number;
    temperature: number;
    flashAttention: boolean;
    quantizationMethod: 'none' | 'q4_0' | 'q4_1' | 'q5_0' | 'q5_1' | 'q8_0' | 'q2_k' | 'q3_k' | 'q4_k' | 'q5_k' | 'q6_k' | 'q8_k';
}
