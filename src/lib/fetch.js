'use strict';

// The following code is required for building browser-compatible bundles.
// It replaces the `node-fetch` module used in a Node.js environment
// with a native Fetch API implementation.

export default self.fetch.bind(self);
export const { Headers, Request, Response } = self;
