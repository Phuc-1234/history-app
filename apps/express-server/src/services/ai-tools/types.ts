export interface GeminiFunctionParameterProperty {
    type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
    description?: string;
    enum?: string[];
}

export interface GeminiFunctionParameters {
    type: "OBJECT";
    properties: Record<string, GeminiFunctionParameterProperty>;
    required?: string[];
}

export interface GeminiFunctionDeclaration {
    name: string;
    description: string;
    parameters: GeminiFunctionParameters;
}

export interface AITool {
    declaration: GeminiFunctionDeclaration;
    execute: (args: any) => Promise<any>;
}
