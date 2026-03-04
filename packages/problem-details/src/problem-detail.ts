import { STATUS_CODES } from 'node:http';

export interface ProblemDetailJSON {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
}

export interface ProblemDetailExtend {
    [key: string | symbol]: unknown;
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

    [key: string | symbol]: unknown;

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

        if (options) {
            for (const key of Reflect.ownKeys(options)) {
                if (typeof key === 'string') {
                    if (!['type', 'title', 'status', 'detail', 'instance', 'cause'].includes(key)
                        && options[key] !== undefined) {
                        this[key] = options[key];
                    }
                    continue;
                }

                const value = options[key];
                if (value !== undefined) {
                    this[key] = value;
                }
            }
        }
    }

    override toString(): string {
        const stack = this.stack ? this.stack.split('\n').slice(1).join('\n') : undefined;
        const extra = Object.entries(this.toJSON()).map(([key, value]) => {
            return `  ${key}: ${value && typeof value === 'object' && 'toString' in value ? value.toString() : value}`;
        }).join('\n');

        return [`${this.name}: ${this.message}`, extra, stack].filter(Boolean).join('\n');
    }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.toString();
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
