export interface Selection {
    id: string;
    category: string;
    label: string;
}

export interface ProjectOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
    subOptions?: ProjectOption[];
    exclusive?: boolean;
}
