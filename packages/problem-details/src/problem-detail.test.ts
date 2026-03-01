import assert from 'node:assert';
import { describe, test } from 'node:test';
import { ProblemDetail } from './problem-detail.js';
import { toProblemDetail } from './to-problem-detail.js';

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

describe('toProblemDetail', () => {
    test('should return the same instance for ProblemDetail', () => {
        const source = new ProblemDetail(418, 'I am a teapot');
        const result = toProblemDetail(source);
        assert.strictEqual(result, source);
    });

    test('should convert Error to ProblemDetail', () => {
        const error = new Error('Test error');
        Object.assign(error, { statusCode: 422, extraField: 'extraValue' });
        const pd = toProblemDetail(error);

        assert.strictEqual(pd.status, 422);
        assert.strictEqual(pd.detail, 'Test error');
        assert.strictEqual(pd.extraField, 'extraValue');
    });

    test('should not inject status default detail when Error message is empty', () => {
        const error = new Error('');
        Object.assign(error, { statusCode: 404 });
        const pd = toProblemDetail(error);

        assert.strictEqual(pd.status, 404);
        assert.strictEqual(pd.detail, undefined);
    });

    test('should convert unknown values to ProblemDetail', () => {
        const pd = toProblemDetail('Unknown error');
        assert.strictEqual(pd.status, 500);
        assert.strictEqual(pd.detail, 'Unknown error');
        assert.strictEqual(pd.cause, 'Unknown error');
    });
});
