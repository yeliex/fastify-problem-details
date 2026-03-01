import { STATUS_CODES } from 'node:http';
import { ProblemDetail as ProblemDetailClass, type ProblemDetailInit } from './problem-detail.js';

export const httpErrorNames = {
    400: 'BadRequest',
    401: 'Unauthorized',
    402: 'PaymentRequired',
    403: 'Forbidden',
    404: 'NotFound',
    405: 'MethodNotAllowed',
    406: 'NotAcceptable',
    407: 'ProxyAuthenticationRequired',
    408: 'RequestTimeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'LengthRequired',
    412: 'PreconditionFailed',
    413: 'PayloadTooLarge',
    414: 'URITooLong',
    415: 'UnsupportedMediaType',
    416: 'RangeNotSatisfiable',
    417: 'ExpectationFailed',
    418: 'ImATeapot',
    421: 'MisdirectedRequest',
    422: 'UnprocessableEntity',
    423: 'Locked',
    424: 'FailedDependency',
    425: 'TooEarly',
    426: 'UpgradeRequired',
    428: 'PreconditionRequired',
    429: 'TooManyRequests',
    431: 'RequestHeaderFieldsTooLarge',
    451: 'UnavailableForLegalReasons',
    500: 'InternalServerError',
    501: 'NotImplemented',
    502: 'BadGateway',
    503: 'ServiceUnavailable',
    504: 'GatewayTimeout',
    505: 'HTTPVersionNotSupported',
    506: 'VariantAlsoNegotiates',
    507: 'InsufficientStorage',
    508: 'LoopDetected',
    509: 'BandwidthLimitExceeded',
    510: 'NotExtended',
    511: 'NetworkAuthenticationRequired',
} as const;

export const createError = (status: number, name: string, detail?: string) => {
    const ProblemDetail = class extends ProblemDetailClass {
        constructor(options?: ProblemDetailInit)
        constructor(detail?: string, options?: ProblemDetailInit)
        constructor(detailOrOptions?: string | ProblemDetailInit, options?: ProblemDetailInit) {
            if (typeof detailOrOptions === 'string') {
                super(status, detailOrOptions, options);
            } else {
                super(status, detail || STATUS_CODES[status], detailOrOptions);
            }

            this.name = name;
        }
    };

    Object.defineProperty(ProblemDetail, 'name', { value: name });

    return ProblemDetail;
};

export const createHttpError = (status: keyof typeof httpErrorNames, detail?: string) => {
    const name = httpErrorNames[status] || 'HttpError';
    return createError(status, name, detail);
};

type HttpErrorStatusCode = keyof typeof httpErrorNames;
type HttpErrorName = (typeof httpErrorNames)[HttpErrorStatusCode];
type HttpErrorConstructor = ReturnType<typeof createHttpError>;

export type HttpErrors = {
    [status in HttpErrorStatusCode]: HttpErrorConstructor;
} & {
    [status in `${HttpErrorStatusCode}`]: HttpErrorConstructor;
} & {
    [name in HttpErrorName]: HttpErrorConstructor;
};

export const httpErrors = (Object.keys(httpErrorNames) as Array<`${HttpErrorStatusCode}`>)
    .reduce((result, statusCode) => {
        const status = Number(statusCode) as HttpErrorStatusCode;
        const name = httpErrorNames[status];
        const ErrorClass = createHttpError(status, STATUS_CODES[status]);

        result[name] = ErrorClass;
        result[status] = ErrorClass;
        result[statusCode] = ErrorClass;

        return result;
    }, {} as Record<string, HttpErrorConstructor>) as HttpErrors;
