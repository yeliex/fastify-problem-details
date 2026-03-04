import assert from 'node:assert';
import { describe, test } from 'node:test';
import { inspect } from 'node:util';
import { ProblemDetail } from './problem-detail.js';

describe('ProblemDetail', () => {
    test('should assign all properties from constructor', () => {
        const pd = new ProblemDetail(404, 'Not found', { type: 'custom:type', title: 'Custom Title', instance: '/foo', foo: 123 });
        assert.strictEqual(pd.status, 404);
        assert.strictEqual(pd.detail, 'Not found');
        assert.strictEqual(pd.type, 'custom:type');
        assert.strictEqual(pd.title, 'Custom Title');
        assert.strictEqual(pd.instance, '/foo');
        assert.strictEqual(pd.foo, 123);
    });

    test('should work with only status', () => {
        const pd = new ProblemDetail(400);
        assert.strictEqual(pd.status, 400);
        assert.strictEqual(pd.type, 'about:blank');
        assert.strictEqual(typeof pd.title, 'string');
    });

    test('should work with status and options', () => {
        const pd = new ProblemDetail(401, { title: 'Unauthorized', bar: 'baz' });

        assert.strictEqual(pd.status, 401);
        assert.strictEqual(pd.title, 'Unauthorized');
        assert.strictEqual(pd.bar, 'baz');
    });

    test('toJSON should return correct object', () => {
        const pd = new ProblemDetail(500, 'Server error', { foo: 'bar', instance: '/err' });
        const json = pd.toJSON();
        assert.strictEqual(json.status, 500);
        assert.strictEqual(json.detail, 'Server error');
        assert.strictEqual(json.foo, 'bar');
        assert.strictEqual(json.instance, '/err');
    });

    test('toJSON should not include undefined fields', () => {
        const pd = new ProblemDetail(400);
        const json = pd.toJSON();
        assert.ok(!('detail' in json));
        assert.ok(!('instance' in json));
    });

    test('should support cause as Error', () => {
        const cause = new Error('root cause');
        const pd = new ProblemDetail(500, 'err', { cause });
        const json = pd.toJSON();
        assert.ok(json.cause);
        assert.strictEqual((json.cause as Error).message, 'root cause');
    });

    test('should support cause as primitive', () => {
        const pd = new ProblemDetail(500, 'err', { cause: 123 });
        const json = pd.toJSON();
        assert.strictEqual(json.cause, 123);
    });

    test('toString should include problem fields', () => {
        const pd = new ProblemDetail(500, 'Server error', { traceId: 'req-1' });
        const result = pd.toString();

        assert.match(result, /ProblemDetail: Server error/);
        assert.match(result, /status: 500/);
        assert.match(result, /traceId: req-1/);
    });

    test('inspect should reuse custom toString output', () => {
        const pd = new ProblemDetail(400, 'Bad Request', { field: 'name' });

        assert.strictEqual(inspect(pd), pd.toString());
    });

    test('should skip undefined custom fields', () => {
        const pd = new ProblemDetail(400, 'Bad Request', {
            field: undefined,
            reason: 'missing',
        });

        assert.strictEqual(pd.field, undefined);
        assert.ok(!('field' in pd.toJSON()));
        assert.strictEqual(pd.toJSON().reason, 'missing');
    });

    test('should support symbol extension fields without exposing in toJSON', () => {
        const PROBLEM_PRIVATE = Symbol.for('private');
        const pd = new ProblemDetail(400, 'Bad Request', {
            [PROBLEM_PRIVATE]: { traceId: 'req-1' },
            code: 'BAD_REQUEST',
        });

        assert.deepStrictEqual(pd[PROBLEM_PRIVATE], { traceId: 'req-1' });

        const json = pd.toJSON();
        assert.strictEqual(json.code, 'BAD_REQUEST');
        assert.strictEqual(Object.getOwnPropertySymbols(json).length, 0);
    });

});

describe('ProblemDetail edge cases', () => {
    test('should handle undefined options gracefully', () => {
        const pd = new ProblemDetail(500);
        assert.strictEqual(pd.status, 500);
        assert.strictEqual(pd.type, 'about:blank');
        assert.strictEqual(pd.title, 'Internal Server Error');
        assert.strictEqual(pd.detail, undefined);
    });

    test('should support extended properties', () => {
        const pd = new ProblemDetail(400, 'Bad Request', { custom: 'value' });
        assert.strictEqual(pd.status, 400);
        assert.strictEqual(pd.detail, 'Bad Request');
        assert.strictEqual(pd.custom, 'value');
    });

    test('should include cause in JSON output', () => {
        const cause = new Error('Root cause');
        const pd = new ProblemDetail(500, 'Server error', { cause });
        const json = pd.toJSON();
        assert.strictEqual(json.status, 500);
        assert.strictEqual(json.detail, 'Server error');
        assert.strictEqual((json.cause as Error).message, 'Root cause');
    });

    test('should exclude undefined fields in JSON output', () => {
        const pd = new ProblemDetail(404);
        const json = pd.toJSON();
        assert.ok(!('detail' in json));
        assert.ok(!('instance' in json));
    });
});
