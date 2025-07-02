import { STATUS_CODES } from 'node:http';

export interface ProblemDetailJSON {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
}

export interface ProblemDetailExtend {
    [key: string]: unknown;
}

export type ProblemDetailInit =
    Partial<Omit<ProblemDetailJSON, 'status' | 'detail'>>
    & ErrorOptions
    & ProblemDetailExtend;

export class ProblemDetail extends Error implements ProblemDetailJSON, ProblemDetailExtend {
    public type: string;
    public title: string;
    public status: number;
    public detail?: string;
    public instance?: string;

    [key: string]: unknown;

    constructor(status: number, options?: ProblemDetailInit)
    constructor(status: number, detail?: string, options?: ProblemDetailInit)
    constructor(status: number, detailOrOptions?: string | ProblemDetailInit, options?: ProblemDetailInit) {
        if (typeof detailOrOptions === 'string') {
            super(detailOrOptions, { cause: options?.cause });
            this.detail = detailOrOptions;
        } else {
            super(undefined, { cause: options?.cause });
            this.detail = undefined;
            options = detailOrOptions;
        }

        Object.setPrototypeOf(this, new.target.prototype);

        this.name = 'ProblemDetail';
        this.status = status;
        this.type = options?.type || 'about:blank';
        this.title = options?.title || STATUS_CODES[status] || 'Unknown Error';
        this.instance = options?.instance;

        for (const key of Object.keys(options || {})) {
            if (!['type', 'title', 'status', 'detail', 'instance', 'cause'].includes(key)) {
                this[key] = options![key];
            }
        }
    }

    toJSON() {
        const json: ProblemDetailJSON & ProblemDetailExtend = {
            type: this.type,
            title: this.title,
            status: this.status,
        };

        if (this.detail !== undefined) json.detail = this.detail;
        if (this.instance !== undefined) json.instance = this.instance;

        if (this.cause !== undefined) {
            json.cause =
                typeof (this.cause as any)?.toJSON === 'function'
                    ? (this.cause as any).toJSON()
                    : this.cause;
        }

        for (const key of Object.keys(this)) {
            if (
                ![
                    'type',
                    'title',
                    'status',
                    'detail',
                    'instance',
                    'cause',
                    'name',
                ].includes(key)
            ) {
                json[key] = this[key];
            }
        }

        return json;
    }
}
