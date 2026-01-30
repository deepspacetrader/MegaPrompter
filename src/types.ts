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
