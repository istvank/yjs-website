(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process,global){
"use strict";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function (global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = (typeof module === "undefined" ? "undefined" : _typeof(module)) === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      prototype[method] = function (arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction ||
    // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  runtime.mark = function (genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function (arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return Promise.resolve(value.arg).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function (unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if ((typeof process === "undefined" ? "undefined" : _typeof(process)) === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
      // If enqueue has been called before, then we want to wait until
      // all previous Promises have been resolved before calling invoke,
      // so that results are always delivered in the correct order. If
      // enqueue has not been called before, then it is important to
      // call invoke immediately, without waiting on a callback to fire,
      // so that the async generator function has the opportunity to do
      // any necessary setup in a predictable way. This predictability
      // is why the Promise constructor synchronously invokes its
      // executor callback, and why async functions synchronously
      // execute code before the first await. Since we implement simple
      // async functions in terms of async generators, it is especially
      // important to get this right, even though it requires care.
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
      // Avoid propagating failures to Promises returned by later
      // invocations of the iterator.
      callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }
        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }
        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }
        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function () {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function (object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function stop() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
// Among the various tricks for obtaining a reference to the global
// object, this seems to be the most reliable technique that does not
// use indirect eval (which violates Content Security Policy).
(typeof global === "undefined" ? "undefined" : _typeof(global)) === "object" ? global : (typeof window === "undefined" ? "undefined" : _typeof(window)) === "object" ? window : (typeof self === "undefined" ? "undefined" : _typeof(self)) === "object" ? self : undefined);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":1}],3:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y) {
  var AbstractConnector = (function () {
    /*
      opts contains the following information:
       role : String Role of this client ("master" or "slave")
       userId : String Uniquely defines the user.
       debug: Boolean Whether to print debug messages (optional)
    */

    function AbstractConnector(y, opts) {
      _classCallCheck(this, AbstractConnector);

      this.y = y;
      if (opts == null) {
        opts = {};
      }
      if (opts.role == null || opts.role === 'master') {
        this.role = 'master';
      } else if (opts.role === 'slave') {
        this.role = 'slave';
      } else {
        throw new Error("Role must be either 'master' or 'slave'!");
      }
      this.y.db.forwardAppliedOperations = opts.forwardAppliedOperations || false;
      this.role = opts.role;
      this.connections = {};
      this.isSynced = false;
      this.userEventListeners = [];
      this.whenSyncedListeners = [];
      this.currentSyncTarget = null;
      this.syncingClients = [];
      this.forwardToSyncingClients = opts.forwardToSyncingClients !== false;
      this.debug = opts.debug === true;
      this.broadcastedHB = false;
      this.syncStep2 = Promise.resolve();
    }

    _createClass(AbstractConnector, [{
      key: 'reconnect',
      value: function reconnect() {}
    }, {
      key: 'disconnect',
      value: function disconnect() {
        this.connections = {};
        this.isSynced = false;
        this.currentSyncTarget = null;
        this.broadcastedHB = false;
        this.syncingClients = [];
        this.whenSyncedListeners = [];
        return this.y.db.stopGarbageCollector();
      }
    }, {
      key: 'setUserId',
      value: function setUserId(userId) {
        this.userId = userId;
        return this.y.db.setUserId(userId);
      }
    }, {
      key: 'onUserEvent',
      value: function onUserEvent(f) {
        this.userEventListeners.push(f);
      }
    }, {
      key: 'userLeft',
      value: function userLeft(user) {
        delete this.connections[user];
        if (user === this.currentSyncTarget) {
          this.currentSyncTarget = null;
          this.findNextSyncTarget();
        }
        this.syncingClients = this.syncingClients.filter(function (cli) {
          return cli !== user;
        });
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.userEventListeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var f = _step.value;

            f({
              action: 'userLeft',
              user: user
            });
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }, {
      key: 'userJoined',
      value: function userJoined(user, role) {
        if (role == null) {
          throw new Error('You must specify the role of the joined user!');
        }
        if (this.connections[user] != null) {
          throw new Error('This user already joined!');
        }
        this.connections[user] = {
          isSynced: false,
          role: role
        };
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.userEventListeners[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var f = _step2.value;

            f({
              action: 'userJoined',
              user: user,
              role: role
            });
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        if (this.currentSyncTarget == null) {
          this.findNextSyncTarget();
        }
      }
      // Execute a function _when_ we are connected.
      // If not connected, wait until connected

    }, {
      key: 'whenSynced',
      value: function whenSynced(f) {
        if (this.isSynced) {
          f();
        } else {
          this.whenSyncedListeners.push(f);
        }
      }
      /*
        returns false, if there is no sync target
       true otherwise
      */

    }, {
      key: 'findNextSyncTarget',
      value: function findNextSyncTarget() {
        if (this.currentSyncTarget != null || this.isSynced) {
          return; // "The current sync has not finished!"
        }

        var syncUser = null;
        for (var uid in this.connections) {
          if (!this.connections[uid].isSynced) {
            syncUser = uid;
            break;
          }
        }
        if (syncUser != null) {
          var conn = this;
          this.currentSyncTarget = syncUser;
          this.y.db.requestTransaction(regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.t0 = conn;
                    _context.t1 = syncUser;
                    return _context.delegateYield(this.getStateSet(), 't2', 3);

                  case 3:
                    _context.t3 = _context.t2;
                    return _context.delegateYield(this.getDeleteSet(), 't4', 5);

                  case 5:
                    _context.t5 = _context.t4;
                    _context.t6 = {
                      type: 'sync step 1',
                      stateSet: _context.t3,
                      deleteSet: _context.t5
                    };

                    _context.t0.send.call(_context.t0, _context.t1, _context.t6);

                  case 8:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));
        } else {
          this.isSynced = true;
          // call when synced listeners
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = this.whenSyncedListeners[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var f = _step3.value;

              f();
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          this.whenSyncedListeners = [];
          this.y.db.requestTransaction(regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    return _context2.delegateYield(this.garbageCollectAfterSync(), 't0', 1);

                  case 1:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));
        }
      }
    }, {
      key: 'send',
      value: function send(uid, message) {
        if (this.debug) {
          console.log('send ' + this.userId + ' -> ' + uid + ': ' + message.type, m); // eslint-disable-line
        }
      }
      /*
        You received a raw message, and you know that it is intended for Yjs. Then call this function.
      */

    }, {
      key: 'receiveMessage',
      value: function receiveMessage(sender, m) {
        var _this = this;

        if (sender === this.userId) {
          return;
        }
        if (this.debug) {
          console.log('receive ' + sender + ' -> ' + this.userId + ': ' + m.type, JSON.parse(JSON.stringify(m))); // eslint-disable-line
        }
        if (m.type === 'sync step 1') {
          (function () {
            // TODO: make transaction, stream the ops
            var conn = _this;
            _this.y.db.requestTransaction(regeneratorRuntime.mark(function _callee3() {
              var currentStateSet, ds, ops;
              return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      return _context3.delegateYield(this.getStateSet(), 't0', 1);

                    case 1:
                      currentStateSet = _context3.t0;
                      return _context3.delegateYield(this.applyDeleteSet(m.deleteSet), 't1', 3);

                    case 3:
                      return _context3.delegateYield(this.getDeleteSet(), 't2', 4);

                    case 4:
                      ds = _context3.t2;
                      return _context3.delegateYield(this.getOperations(m.stateSet), 't3', 6);

                    case 6:
                      ops = _context3.t3;

                      conn.send(sender, {
                        type: 'sync step 2',
                        os: ops,
                        stateSet: currentStateSet,
                        deleteSet: ds
                      });
                      if (this.forwardToSyncingClients) {
                        conn.syncingClients.push(sender);
                        setTimeout(function () {
                          conn.syncingClients = conn.syncingClients.filter(function (cli) {
                            return cli !== sender;
                          });
                          conn.send(sender, {
                            type: 'sync done'
                          });
                        }, conn.syncingClientDuration);
                      } else {
                        conn.send(sender, {
                          type: 'sync done'
                        });
                      }
                      conn._setSyncedWith(sender);

                    case 10:
                    case 'end':
                      return _context3.stop();
                  }
                }
              }, _callee3, this);
            }));
          })();
        } else if (m.type === 'sync step 2') {
          var broadcastHB;
          var db;

          (function () {
            var conn = _this;
            broadcastHB = !_this.broadcastedHB;

            _this.broadcastedHB = true;
            db = _this.y.db;

            _this.syncStep2 = new Promise(function (resolve) {
              db.requestTransaction(regeneratorRuntime.mark(function _callee5() {
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        return _context5.delegateYield(this.applyDeleteSet(m.deleteSet), 't0', 1);

                      case 1:
                        this.store.apply(m.os);
                        db.requestTransaction(regeneratorRuntime.mark(function _callee4() {
                          var ops;
                          return regeneratorRuntime.wrap(function _callee4$(_context4) {
                            while (1) {
                              switch (_context4.prev = _context4.next) {
                                case 0:
                                  return _context4.delegateYield(this.getOperations(m.stateSet), 't0', 1);

                                case 1:
                                  ops = _context4.t0;

                                  if (ops.length > 0) {
                                    m = {
                                      type: 'update',
                                      ops: ops
                                    };
                                    if (!broadcastHB) {
                                      // TODO: consider to broadcast here..
                                      conn.send(sender, m);
                                    } else {
                                      // broadcast only once!
                                      conn.broadcast(m);
                                    }
                                  }
                                  resolve();

                                case 4:
                                case 'end':
                                  return _context4.stop();
                              }
                            }
                          }, _callee4, this);
                        }));

                      case 3:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, _callee5, this);
              }));
            });
          })();
        } else if (m.type === 'sync done') {
          var self = this;
          this.syncStep2.then(function () {
            self._setSyncedWith(sender);
          });
        } else if (m.type === 'update') {
          if (this.forwardToSyncingClients) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = this.syncingClients[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var client = _step4.value;

                this.send(client, m);
              }
            } catch (err) {
              _didIteratorError4 = true;
              _iteratorError4 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                  _iterator4.return();
                }
              } finally {
                if (_didIteratorError4) {
                  throw _iteratorError4;
                }
              }
            }
          }
          if (this.y.db.forwardAppliedOperations) {
            var delops = m.ops.filter(function (o) {
              return o.struct === 'Delete';
            });
            if (delops.length > 0) {
              this.broadcast({
                type: 'update',
                ops: delops
              });
            }
          }
          this.y.db.apply(m.ops);
        }
      }
    }, {
      key: '_setSyncedWith',
      value: function _setSyncedWith(user) {
        var conn = this.connections[user];
        if (conn != null) {
          conn.isSynced = true;
        }
        if (user === this.currentSyncTarget) {
          this.currentSyncTarget = null;
          this.findNextSyncTarget();
        }
      }
      /*
        Currently, the HB encodes operations as JSON. For the moment I want to keep it
        that way. Maybe we support encoding in the HB as XML in the future, but for now I don't want
        too much overhead. Y is very likely to get changed a lot in the future
         Because we don't want to encode JSON as string (with character escaping, wich makes it pretty much unreadable)
        we encode the JSON as XML.
         When the HB support encoding as XML, the format should look pretty much like this.
         does not support primitive values as array elements
        expects an ltx (less than xml) object
      */

    }, {
      key: 'parseMessageFromXml',
      value: function parseMessageFromXml(m) {
        function parseArray(node) {
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = node.children[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var n = _step5.value;

              if (n.getAttribute('isArray') === 'true') {
                return parseArray(n);
              } else {
                return parseObject(n);
              }
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
        function parseObject(node) {
          var json = {};
          for (var attrName in node.attrs) {
            var value = node.attrs[attrName];
            var int = parseInt(value, 10);
            if (isNaN(int) || '' + int !== value) {
              json[attrName] = value;
            } else {
              json[attrName] = int;
            }
          }
          for (var n in node.children) {
            var name = n.name;
            if (n.getAttribute('isArray') === 'true') {
              json[name] = parseArray(n);
            } else {
              json[name] = parseObject(n);
            }
          }
          return json;
        }
        parseObject(m);
      }
      /*
        encode message in xml
        we use string because Strophe only accepts an "xml-string"..
        So {a:4,b:{c:5}} will look like
        <y a="4">
          <b c="5"></b>
        </y>
        m - ltx element
        json - Object
      */

    }, {
      key: 'encodeMessageToXml',
      value: function encodeMessageToXml(msg, obj) {
        // attributes is optional
        function encodeObject(m, json) {
          for (var name in json) {
            var value = json[name];
            if (name == null) {
              // nop
            } else if (value.constructor === Object) {
                encodeObject(m.c(name), value);
              } else if (value.constructor === Array) {
                encodeArray(m.c(name), value);
              } else {
                m.setAttribute(name, value);
              }
          }
        }
        function encodeArray(m, array) {
          m.setAttribute('isArray', 'true');
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = array[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var e = _step6.value;

              if (e.constructor === Object) {
                encodeObject(m.c('array-element'), e);
              } else {
                encodeArray(m.c('array-element'), e);
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }
        if (obj.constructor === Object) {
          encodeObject(msg.c('y', { xmlns: 'http://y.ninja/connector-stanza' }), obj);
        } else if (obj.constructor === Array) {
          encodeArray(msg.c('y', { xmlns: 'http://y.ninja/connector-stanza' }), obj);
        } else {
          throw new Error("I can't encode this json!");
        }
      }
    }]);

    return AbstractConnector;
  })();

  Y.AbstractConnector = AbstractConnector;
};

},{}],4:[function(require,module,exports){
/* global getRandom, wait, async */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

module.exports = function (Y) {
  var globalRoom = {
    users: {},
    buffers: {},
    removeUser: function removeUser(user) {
      for (var i in this.users) {
        this.users[i].userLeft(user);
      }
      delete this.users[user];
      delete this.buffers[user];
    },
    addUser: function addUser(connector) {
      this.users[connector.userId] = connector;
      this.buffers[connector.userId] = [];
      for (var uname in this.users) {
        if (uname !== connector.userId) {
          var u = this.users[uname];
          u.userJoined(connector.userId, 'master');
          connector.userJoined(u.userId, 'master');
        }
      }
    }
  };
  Y.utils.globalRoom = globalRoom;

  function _flushOne() {
    var bufs = [];
    for (var i in globalRoom.buffers) {
      if (globalRoom.buffers[i].length > 0) {
        bufs.push(i);
      }
    }
    if (bufs.length > 0) {
      var userId = getRandom(bufs);
      var m = globalRoom.buffers[userId].shift();
      var user = globalRoom.users[userId];
      user.receiveMessage(m[0], m[1]);
      return true;
    } else {
      return false;
    }
  }

  // setInterval(flushOne, 10)

  var userIdCounter = 0;

  var Test = (function (_Y$AbstractConnector) {
    _inherits(Test, _Y$AbstractConnector);

    function Test(y, options) {
      _classCallCheck(this, Test);

      if (options === undefined) {
        throw new Error('Options must not be undefined!');
      }
      options.role = 'master';
      options.forwardToSyncingClients = false;

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Test).call(this, y, options));

      _this.setUserId(userIdCounter++ + '').then(function () {
        globalRoom.addUser(_this);
      });
      _this.globalRoom = globalRoom;
      _this.syncingClientDuration = 0;
      return _this;
    }

    _createClass(Test, [{
      key: 'receiveMessage',
      value: function receiveMessage(sender, m) {
        _get(Object.getPrototypeOf(Test.prototype), 'receiveMessage', this).call(this, sender, JSON.parse(JSON.stringify(m)));
      }
    }, {
      key: 'send',
      value: function send(userId, message) {
        var buffer = globalRoom.buffers[userId];
        if (buffer != null) {
          buffer.push(JSON.parse(JSON.stringify([this.userId, message])));
        }
      }
    }, {
      key: 'broadcast',
      value: function broadcast(message) {
        for (var key in globalRoom.buffers) {
          globalRoom.buffers[key].push(JSON.parse(JSON.stringify([this.userId, message])));
        }
      }
    }, {
      key: 'isDisconnected',
      value: function isDisconnected() {
        return globalRoom.users[this.userId] == null;
      }
    }, {
      key: 'reconnect',
      value: function reconnect() {
        if (this.isDisconnected()) {
          globalRoom.addUser(this);
          _get(Object.getPrototypeOf(Test.prototype), 'reconnect', this).call(this);
        }
        return this.flushAll();
      }
    }, {
      key: 'disconnect',
      value: function disconnect() {
        if (!this.isDisconnected()) {
          globalRoom.removeUser(this.userId);
          _get(Object.getPrototypeOf(Test.prototype), 'disconnect', this).call(this);
        }
        return wait();
      }
    }, {
      key: 'flush',
      value: function flush() {
        var self = this;
        return async(regeneratorRuntime.mark(function _callee() {
          var m;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return wait();

                case 2:
                  if (!(globalRoom.buffers[self.userId].length > 0)) {
                    _context.next = 9;
                    break;
                  }

                  m = globalRoom.buffers[self.userId].shift();

                  this.receiveMessage(m[0], m[1]);
                  _context.next = 7;
                  return wait();

                case 7:
                  _context.next = 2;
                  break;

                case 9:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
      }
    }, {
      key: 'flushAll',
      value: function flushAll() {
        return new Promise(function (resolve) {
          // flushes may result in more created operations,
          // flush until there is nothing more to flush
          function nextFlush() {
            var c = _flushOne();
            if (c) {
              while (_flushOne()) {
                // nop
              }
              wait().then(nextFlush);
            } else {
              wait().then(function () {
                resolve();
              });
            }
          }
          // in the case that there are
          // still actions that want to be performed
          wait().then(nextFlush);
        });
      }
      /*
        Flushes an operation for some user..
      */

    }, {
      key: 'flushOne',
      value: function flushOne() {
        _flushOne();
      }
    }]);

    return Test;
  })(Y.AbstractConnector);

  Y.Test = Test;
};

},{}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y) {
  /*
    Partial definition of an OperationStore.
    TODO: name it Database, operation store only holds operations.
     A database definition must alse define the following methods:
    * logTable() (optional)
      - show relevant information information in a table
    * requestTransaction(makeGen)
      - request a transaction
    * destroy()
      - destroy the database
  */

  var AbstractDatabase = (function () {
    function AbstractDatabase(y, opts) {
      _classCallCheck(this, AbstractDatabase);

      this.y = y;
      // whether to broadcast all applied operations (insert & delete hook)
      this.forwardAppliedOperations = false;
      // E.g. this.listenersById[id] : Array<Listener>
      this.listenersById = {};
      // Execute the next time a transaction is requested
      this.listenersByIdExecuteNow = [];
      // A transaction is requested
      this.listenersByIdRequestPending = false;
      /* To make things more clear, the following naming conventions:
         * ls : we put this.listenersById on ls
         * l : Array<Listener>
         * id : Id (can't use as property name)
         * sid : String (converted from id via JSON.stringify
                         so we can use it as a property name)
         Always remember to first overwrite
        a property before you iterate over it!
      */
      // TODO: Use ES7 Weak Maps. This way types that are no longer user,
      // wont be kept in memory.
      this.initializedTypes = {};
      this.whenUserIdSetListener = null;
      this.waitingTransactions = [];
      this.transactionInProgress = false;
      if (typeof YConcurrency_TestingMode !== 'undefined') {
        this.executeOrder = [];
      }
      this.gc1 = []; // first stage
      this.gc2 = []; // second stage -> after that, remove the op
      this.gcTimeout = opts.gcTimeout || 5000;
      var os = this;
      function garbageCollect() {
        return new Promise(function (resolve) {
          os.requestTransaction(regeneratorRuntime.mark(function _callee() {
            var i, oid;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!(os.y.connector != null && os.y.connector.isSynced)) {
                      _context.next = 10;
                      break;
                    }

                    _context.t0 = regeneratorRuntime.keys(os.gc2);

                  case 2:
                    if ((_context.t1 = _context.t0()).done) {
                      _context.next = 8;
                      break;
                    }

                    i = _context.t1.value;
                    oid = os.gc2[i];
                    return _context.delegateYield(this.garbageCollectOperation(oid), 't2', 6);

                  case 6:
                    _context.next = 2;
                    break;

                  case 8:
                    os.gc2 = os.gc1;
                    os.gc1 = [];

                  case 10:
                    if (os.gcTimeout > 0) {
                      os.gcInterval = setTimeout(garbageCollect, os.gcTimeout);
                    }
                    resolve();

                  case 12:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));
        });
      }
      this.garbageCollect = garbageCollect;
      if (this.gcTimeout > 0) {
        garbageCollect();
      }
    }

    _createClass(AbstractDatabase, [{
      key: 'addToDebug',
      value: function addToDebug() {
        if (typeof YConcurrency_TestingMode !== 'undefined') {
          var command = Array.prototype.map.call(arguments, function (s) {
            if (typeof s === 'string') {
              return s;
            } else {
              return JSON.stringify(s);
            }
          }).join('').replace(/"/g, "'").replace(/,/g, ', ').replace(/:/g, ': ');
          this.executeOrder.push(command);
        }
      }
    }, {
      key: 'getDebugData',
      value: function getDebugData() {
        console.log(this.executeOrder.join('\n'));
      }
    }, {
      key: 'stopGarbageCollector',
      value: function stopGarbageCollector() {
        var self = this;
        return new Promise(function (resolve) {
          self.requestTransaction(regeneratorRuntime.mark(function _callee2() {
            var ungc, i, op;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    ungc = self.gc1.concat(self.gc2);

                    self.gc1 = [];
                    self.gc2 = [];
                    _context2.t0 = regeneratorRuntime.keys(ungc);

                  case 4:
                    if ((_context2.t1 = _context2.t0()).done) {
                      _context2.next = 12;
                      break;
                    }

                    i = _context2.t1.value;
                    return _context2.delegateYield(this.getOperation(ungc[i]), 't2', 7);

                  case 7:
                    op = _context2.t2;

                    delete op.gc;
                    return _context2.delegateYield(this.setOperation(op), 't3', 10);

                  case 10:
                    _context2.next = 4;
                    break;

                  case 12:
                    resolve();

                  case 13:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));
        });
      }
      /*
        Try to add to GC.
         TODO: rename this function
         Rulez:
        * Only gc if this user is online
        * The most left element in a list must not be gc'd.
          => There is at least one element in the list
         returns true iff op was added to GC
      */

    }, {
      key: 'addToGarbageCollector',
      value: function addToGarbageCollector(op, left) {
        if (op.gc == null && op.deleted === true && this.y.connector.isSynced && left != null && left.deleted === true) {
          op.gc = true;
          this.gc1.push(op.id);
          return true;
        } else {
          return false;
        }
      }
    }, {
      key: 'removeFromGarbageCollector',
      value: function removeFromGarbageCollector(op) {
        function filter(o) {
          return !Y.utils.compareIds(o, op.id);
        }
        this.gc1 = this.gc1.filter(filter);
        this.gc2 = this.gc2.filter(filter);
        delete op.gc;
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        clearInterval(this.gcInterval);
        this.gcInterval = null;
      }
    }, {
      key: 'setUserId',
      value: function setUserId(userId) {
        var self = this;
        return new Promise(function (resolve) {
          self.requestTransaction(regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    self.userId = userId;
                    return _context3.delegateYield(this.getState(userId), 't0', 2);

                  case 2:
                    self.opClock = _context3.t0.clock;

                    if (self.whenUserIdSetListener != null) {
                      self.whenUserIdSetListener();
                      self.whenUserIdSetListener = null;
                    }
                    resolve();

                  case 5:
                  case 'end':
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));
        });
      }
    }, {
      key: 'whenUserIdSet',
      value: function whenUserIdSet(f) {
        if (this.userId != null) {
          f();
        } else {
          this.whenUserIdSetListener = f;
        }
      }
    }, {
      key: 'getNextOpId',
      value: function getNextOpId() {
        if (this.userId == null) {
          throw new Error('OperationStore not yet initialized!');
        }
        return [this.userId, this.opClock++];
      }
      /*
        Apply a list of operations.
         * get a transaction
        * check whether all Struct.*.requiredOps are in the OS
        * check if it is an expected op (otherwise wait for it)
        * check if was deleted, apply a delete operation after op was applied
      */

    }, {
      key: 'apply',
      value: function apply(ops) {
        for (var key in ops) {
          var o = ops[key];
          var required = Y.Struct[o.struct].requiredOps(o);
          this.whenOperationsExist(required, o);
        }
      }
      /*
        op is executed as soon as every operation requested is available.
        Note that Transaction can (and should) buffer requests.
      */

    }, {
      key: 'whenOperationsExist',
      value: function whenOperationsExist(ids, op) {
        if (ids.length > 0) {
          var listener = {
            op: op,
            missing: ids.length
          };

          for (var key in ids) {
            var id = ids[key];
            var sid = JSON.stringify(id);
            var l = this.listenersById[sid];
            if (l == null) {
              l = [];
              this.listenersById[sid] = l;
            }
            l.push(listener);
          }
        } else {
          this.listenersByIdExecuteNow.push({
            op: op
          });
        }

        if (this.listenersByIdRequestPending) {
          return;
        }

        this.listenersByIdRequestPending = true;
        var store = this;

        this.requestTransaction(regeneratorRuntime.mark(function _callee4() {
          var exeNow, ls, key, o, sid, l, id, listener;
          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  exeNow = store.listenersByIdExecuteNow;

                  store.listenersByIdExecuteNow = [];

                  ls = store.listenersById;

                  store.listenersById = {};

                  store.listenersByIdRequestPending = false;

                  _context4.t0 = regeneratorRuntime.keys(exeNow);

                case 6:
                  if ((_context4.t1 = _context4.t0()).done) {
                    _context4.next = 12;
                    break;
                  }

                  key = _context4.t1.value;
                  o = exeNow[key].op;
                  return _context4.delegateYield(store.tryExecute.call(this, o), 't2', 10);

                case 10:
                  _context4.next = 6;
                  break;

                case 12:
                  _context4.t3 = regeneratorRuntime.keys(ls);

                case 13:
                  if ((_context4.t4 = _context4.t3()).done) {
                    _context4.next = 34;
                    break;
                  }

                  sid = _context4.t4.value;
                  l = ls[sid];
                  id = JSON.parse(sid);
                  return _context4.delegateYield(this.getOperation(id), 't5', 18);

                case 18:
                  _context4.t6 = _context4.t5;

                  if (!(_context4.t6 == null)) {
                    _context4.next = 23;
                    break;
                  }

                  store.listenersById[sid] = l;
                  _context4.next = 32;
                  break;

                case 23:
                  _context4.t7 = regeneratorRuntime.keys(l);

                case 24:
                  if ((_context4.t8 = _context4.t7()).done) {
                    _context4.next = 32;
                    break;
                  }

                  key = _context4.t8.value;
                  listener = l[key];
                  o = listener.op;

                  if (!(--listener.missing === 0)) {
                    _context4.next = 30;
                    break;
                  }

                  return _context4.delegateYield(store.tryExecute.call(this, o), 't9', 30);

                case 30:
                  _context4.next = 24;
                  break;

                case 32:
                  _context4.next = 13;
                  break;

                case 34:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));
      }
      /*
        Actually execute an operation, when all expected operations are available.
      */

    }, {
      key: 'tryExecute',
      value: regeneratorRuntime.mark(function tryExecute(op) {
        return regeneratorRuntime.wrap(function tryExecute$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this.store.addToDebug('yield* this.store.tryExecute.call(this, ', JSON.stringify(op), ')');

                if (!(op.struct === 'Delete')) {
                  _context5.next = 6;
                  break;
                }

                return _context5.delegateYield(Y.Struct.Delete.execute.call(this, op), 't0', 3);

              case 3:
                return _context5.delegateYield(this.store.operationAdded(this, op), 't1', 4);

              case 4:
                _context5.next = 16;
                break;

              case 6:
                return _context5.delegateYield(this.getOperation(op.id), 't3', 7);

              case 7:
                _context5.t4 = _context5.t3;
                _context5.t2 = _context5.t4 == null;

                if (!_context5.t2) {
                  _context5.next = 12;
                  break;
                }

                return _context5.delegateYield(this.isGarbageCollected(op.id), 't5', 11);

              case 11:
                _context5.t2 = !_context5.t5;

              case 12:
                if (!_context5.t2) {
                  _context5.next = 16;
                  break;
                }

                return _context5.delegateYield(Y.Struct[op.struct].execute.call(this, op), 't6', 14);

              case 14:
                return _context5.delegateYield(this.addOperation(op), 't7', 15);

              case 15:
                return _context5.delegateYield(this.store.operationAdded(this, op), 't8', 16);

              case 16:
              case 'end':
                return _context5.stop();
            }
          }
        }, tryExecute, this);
      })
      // called by a transaction when an operation is added

    }, {
      key: 'operationAdded',
      value: regeneratorRuntime.mark(function operationAdded(transaction, op) {
        var target, type, o, state, sid, l, key, listener, t, delop;
        return regeneratorRuntime.wrap(function operationAdded$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(op.struct === 'Delete')) {
                  _context6.next = 9;
                  break;
                }

                return _context6.delegateYield(transaction.getOperation(op.target), 't0', 2);

              case 2:
                target = _context6.t0;

                if (!(target != null)) {
                  _context6.next = 7;
                  break;
                }

                type = transaction.store.initializedTypes[JSON.stringify(target.parent)];

                if (!(type != null)) {
                  _context6.next = 7;
                  break;
                }

                return _context6.delegateYield(type._changed(transaction, {
                  struct: 'Delete',
                  target: op.target
                }), 't1', 7);

              case 7:
                _context6.next = 36;
                break;

              case 9:
                // increase SS
                o = op;
                return _context6.delegateYield(transaction.getState(op.id[0]), 't2', 11);

              case 11:
                state = _context6.t2;

              case 12:
                if (!(o != null && o.id[1] === state.clock && op.id[0] === o.id[0])) {
                  _context6.next = 19;
                  break;
                }

                // either its a new operation (1. case), or it is an operation that was deleted, but is not yet in the OS
                state.clock++;
                return _context6.delegateYield(transaction.checkDeleteStoreForState(state), 't3', 15);

              case 15:
                return _context6.delegateYield(transaction.os.findNext(o.id), 't4', 16);

              case 16:
                o = _context6.t4;
                _context6.next = 12;
                break;

              case 19:
                return _context6.delegateYield(transaction.setState(state), 't5', 20);

              case 20:

                // notify whenOperation listeners (by id)
                sid = JSON.stringify(op.id);
                l = this.listenersById[sid];

                delete this.listenersById[sid];

                if (l != null) {
                  for (key in l) {
                    listener = l[key];

                    if (--listener.missing === 0) {
                      this.whenOperationsExist([], listener.op);
                    }
                  }
                }
                t = this.initializedTypes[JSON.stringify(op.parent)];
                // notify parent, if it has been initialized as a custom type

                if (!(t != null)) {
                  _context6.next = 27;
                  break;
                }

                return _context6.delegateYield(t._changed(transaction, Y.utils.copyObject(op)), 't6', 27);

              case 27:
                _context6.t7 = !op.deleted;

                if (!_context6.t7) {
                  _context6.next = 31;
                  break;
                }

                return _context6.delegateYield(transaction.isDeleted(op.id), 't8', 30);

              case 30:
                _context6.t7 = _context6.t8;

              case 31:
                if (!_context6.t7) {
                  _context6.next = 36;
                  break;
                }

                delop = {
                  struct: 'Delete',
                  target: op.id
                };
                return _context6.delegateYield(Y.Struct['Delete'].execute.call(transaction, delop), 't9', 34);

              case 34:
                if (!(t != null)) {
                  _context6.next = 36;
                  break;
                }

                return _context6.delegateYield(t._changed(transaction, delop), 't10', 36);

              case 36:
              case 'end':
                return _context6.stop();
            }
          }
        }, operationAdded, this);
      })
    }, {
      key: 'getNextRequest',
      value: function getNextRequest() {
        if (this.waitingTransactions.length === 0) {
          this.transactionInProgress = false;
          return null;
        } else {
          return this.waitingTransactions.shift();
        }
      }
    }, {
      key: 'requestTransaction',
      value: function requestTransaction(makeGen, callImmediately) {
        if (callImmediately) {
          this.transact(makeGen);
        } else if (!this.transactionInProgress) {
          this.transactionInProgress = true;
          var self = this;
          setTimeout(function () {
            self.transact(makeGen);
          }, 0);
        } else {
          this.waitingTransactions.push(makeGen);
        }
      }
    }]);

    return AbstractDatabase;
  })();

  Y.AbstractDatabase = AbstractDatabase;
};

},{}],6:[function(require,module,exports){
'use strict';

/*
 An operation also defines the structure of a type. This is why operation and
 structure are used interchangeably here.

 It must be of the type Object. I hope to achieve some performance
 improvements when working on databases that support the json format.

 An operation must have the following properties:

 * encode
     - Encode the structure in a readable format (preferably string- todo)
 * decode (todo)
     - decode structure to json
 * execute
     - Execute the semantics of an operation.
 * requiredOps
     - Operations that are required to execute this operation.
*/

module.exports = function (Y) {
  var Struct = {
    /* This is the only operation that is actually not a structure, because
    it is not stored in the OS. This is why it _does not_ have an id
     op = {
      target: Id
    }
    */
    Delete: {
      encode: function encode(op) {
        return op;
      },
      requiredOps: function requiredOps(op) {
        return []; // [op.target]
      },
      execute: regeneratorRuntime.mark(function execute(op) {
        return regeneratorRuntime.wrap(function execute$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.delegateYield(this.deleteOperation(op.target), 't0', 1);

              case 1:
                return _context.abrupt('return', _context.t0);

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, execute, this);
      })
    },
    Insert: {
      /* {
          content: any,
          id: Id,
          left: Id,
          origin: Id,
          right: Id,
          parent: Id,
          parentSub: string (optional), // child of Map type
        }
      */
      encode: function encode(op) {
        // TODO: you could not send the "left" property, then you also have to
        // "op.left = null" in $execute or $decode
        var e = {
          id: op.id,
          left: op.left,
          right: op.right,
          origin: op.origin,
          parent: op.parent,
          struct: op.struct
        };
        if (op.parentSub != null) {
          e.parentSub = op.parentSub;
        }
        if (op.opContent != null) {
          e.opContent = op.opContent;
        } else {
          e.content = op.content;
        }

        return e;
      },
      requiredOps: function requiredOps(op) {
        var ids = [];
        if (op.left != null) {
          ids.push(op.left);
        }
        if (op.right != null) {
          ids.push(op.right);
        }
        if (op.origin != null && !Y.utils.compareIds(op.left, op.origin)) {
          ids.push(op.origin);
        }
        // if (op.right == null && op.left == null) {
        ids.push(op.parent);

        if (op.opContent != null) {
          ids.push(op.opContent);
        }
        return ids;
      },
      getDistanceToOrigin: regeneratorRuntime.mark(function getDistanceToOrigin(op) {
        var d, o;
        return regeneratorRuntime.wrap(function getDistanceToOrigin$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(op.left == null)) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt('return', 0);

              case 4:
                d = 0;
                return _context2.delegateYield(this.getOperation(op.left), 't0', 6);

              case 6:
                o = _context2.t0;

              case 7:
                if (Y.utils.compareIds(op.origin, o ? o.id : null)) {
                  _context2.next = 17;
                  break;
                }

                d++;

                if (!(o.left == null)) {
                  _context2.next = 13;
                  break;
                }

                return _context2.abrupt('break', 17);

              case 13:
                return _context2.delegateYield(this.getOperation(o.left), 't1', 14);

              case 14:
                o = _context2.t1;

              case 15:
                _context2.next = 7;
                break;

              case 17:
                return _context2.abrupt('return', d);

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, getDistanceToOrigin, this);
      }),
      /*
      # $this has to find a unique position between origin and the next known character
      # case 1: $origin equals $o.origin: the $creator parameter decides if left or right
      #         let $OL= [o1,o2,o3,o4], whereby $this is to be inserted between o1 and o4
      #         o2,o3 and o4 origin is 1 (the position of o2)
      #         there is the case that $this.creator < o2.creator, but o3.creator < $this.creator
      #         then o2 knows o3. Since on another client $OL could be [o1,o3,o4] the problem is complex
      #         therefore $this would be always to the right of o3
      # case 2: $origin < $o.origin
      #         if current $this insert_position > $o origin: $this ins
      #         else $insert_position will not change
      #         (maybe we encounter case 1 later, then this will be to the right of $o)
      # case 3: $origin > $o.origin
      #         $this insert_position is to the left of $o (forever!)
      */
      execute: regeneratorRuntime.mark(function execute(op) {
        var i, distanceToOrigin, o, parent, start, startId, oOriginDistance, left, right;
        return regeneratorRuntime.wrap(function execute$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.delegateYield(Struct.Insert.getDistanceToOrigin.call(this, op), 't0', 1);

              case 1:
                distanceToOrigin = i = _context3.t0;

                if (!(op.left != null)) {
                  _context3.next = 14;
                  break;
                }

                return _context3.delegateYield(this.getOperation(op.left), 't1', 4);

              case 4:
                o = _context3.t1;

                if (!(o.right == null)) {
                  _context3.next = 9;
                  break;
                }

                _context3.t2 = null;
                _context3.next = 11;
                break;

              case 9:
                return _context3.delegateYield(this.getOperation(o.right), 't3', 10);

              case 10:
                _context3.t2 = _context3.t3;

              case 11:
                o = _context3.t2;
                _context3.next = 25;
                break;

              case 14:
                return _context3.delegateYield(this.getOperation(op.parent), 't4', 15);

              case 15:
                parent = _context3.t4;
                startId = op.parentSub ? parent.map[op.parentSub] : parent.start;

                if (!(startId == null)) {
                  _context3.next = 21;
                  break;
                }

                _context3.t5 = null;
                _context3.next = 23;
                break;

              case 21:
                return _context3.delegateYield(this.getOperation(startId), 't6', 22);

              case 22:
                _context3.t5 = _context3.t6;

              case 23:
                start = _context3.t5;

                o = start;

              case 25:
                if (!true) {
                  _context3.next = 51;
                  break;
                }

                if (!(o != null && !Y.utils.compareIds(o.id, op.right))) {
                  _context3.next = 48;
                  break;
                }

                return _context3.delegateYield(Struct.Insert.getDistanceToOrigin.call(this, o), 't7', 28);

              case 28:
                oOriginDistance = _context3.t7;

                if (!(oOriginDistance === i)) {
                  _context3.next = 33;
                  break;
                }

                // case 1
                if (o.id[0] < op.id[0]) {
                  op.left = o.id;
                  distanceToOrigin = i + 1;
                }
                _context3.next = 38;
                break;

              case 33:
                if (!(oOriginDistance < i)) {
                  _context3.next = 37;
                  break;
                }

                // case 2
                if (i - distanceToOrigin <= oOriginDistance) {
                  op.left = o.id;
                  distanceToOrigin = i + 1;
                }
                _context3.next = 38;
                break;

              case 37:
                return _context3.abrupt('break', 51);

              case 38:
                i++;

                if (!o.right) {
                  _context3.next = 44;
                  break;
                }

                return _context3.delegateYield(this.getOperation(o.right), 't9', 41);

              case 41:
                _context3.t8 = _context3.t9;
                _context3.next = 45;
                break;

              case 44:
                _context3.t8 = null;

              case 45:
                o = _context3.t8;
                _context3.next = 49;
                break;

              case 48:
                return _context3.abrupt('break', 51);

              case 49:
                _context3.next = 25;
                break;

              case 51:

                // reconnect..
                left = null;
                right = null;
                _context3.t10 = parent;

                if (_context3.t10) {
                  _context3.next = 57;
                  break;
                }

                return _context3.delegateYield(this.getOperation(op.parent), 't11', 56);

              case 56:
                _context3.t10 = _context3.t11;

              case 57:
                parent = _context3.t10;

                if (!(op.left != null)) {
                  _context3.next = 66;
                  break;
                }

                return _context3.delegateYield(this.getOperation(op.left), 't12', 60);

              case 60:
                left = _context3.t12;

                op.right = left.right;
                left.right = op.id;

                return _context3.delegateYield(this.setOperation(left), 't13', 64);

              case 64:
                _context3.next = 67;
                break;

              case 66:
                op.right = op.parentSub ? parent.map[op.parentSub] || null : parent.start;

              case 67:
                if (!(op.right != null)) {
                  _context3.next = 73;
                  break;
                }

                return _context3.delegateYield(this.getOperation(op.right), 't14', 69);

              case 69:
                right = _context3.t14;

                right.left = op.id;

                // if right exists, and it is supposed to be gc'd. Remove it from the gc
                if (right.gc != null) {
                  this.store.removeFromGarbageCollector(right);
                }
                return _context3.delegateYield(this.setOperation(right), 't15', 73);

              case 73:
                if (!(op.parentSub != null)) {
                  _context3.next = 83;
                  break;
                }

                if (!(left == null)) {
                  _context3.next = 77;
                  break;
                }

                parent.map[op.parentSub] = op.id;
                return _context3.delegateYield(this.setOperation(parent), 't16', 77);

              case 77:
                if (!(op.right != null)) {
                  _context3.next = 79;
                  break;
                }

                return _context3.delegateYield(this.deleteOperation(op.right, true), 't17', 79);

              case 79:
                if (!(op.left != null)) {
                  _context3.next = 81;
                  break;
                }

                return _context3.delegateYield(this.deleteOperation(op.id, true), 't18', 81);

              case 81:
                _context3.next = 87;
                break;

              case 83:
                if (!(right == null || left == null)) {
                  _context3.next = 87;
                  break;
                }

                if (right == null) {
                  parent.end = op.id;
                }
                if (left == null) {
                  parent.start = op.id;
                }
                return _context3.delegateYield(this.setOperation(parent), 't19', 87);

              case 87:
              case 'end':
                return _context3.stop();
            }
          }
        }, execute, this);
      })
    },
    List: {
      /*
      {
        start: null,
        end: null,
        struct: "List",
        type: "",
        id: this.os.getNextOpId()
      }
      */
      encode: function encode(op) {
        return {
          struct: 'List',
          id: op.id,
          type: op.type
        };
      },
      requiredOps: function requiredOps() {
        /*
        var ids = []
        if (op.start != null) {
          ids.push(op.start)
        }
        if (op.end != null){
          ids.push(op.end)
        }
        return ids
        */
        return [];
      },
      execute: regeneratorRuntime.mark(function execute(op) {
        return regeneratorRuntime.wrap(function execute$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                op.start = null;
                op.end = null;

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, execute, this);
      }),
      ref: regeneratorRuntime.mark(function ref(op, pos) {
        var res, o;
        return regeneratorRuntime.wrap(function ref$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(op.start == null)) {
                  _context5.next = 2;
                  break;
                }

                return _context5.abrupt('return', null);

              case 2:
                res = null;
                return _context5.delegateYield(this.getOperation(op.start), 't0', 4);

              case 4:
                o = _context5.t0;

              case 5:
                if (!true) {
                  _context5.next = 15;
                  break;
                }

                if (!o.deleted) {
                  res = o;
                  pos--;
                }

                if (!(pos >= 0 && o.right != null)) {
                  _context5.next = 12;
                  break;
                }

                return _context5.delegateYield(this.getOperation(o.right), 't1', 9);

              case 9:
                o = _context5.t1;
                _context5.next = 13;
                break;

              case 12:
                return _context5.abrupt('break', 15);

              case 13:
                _context5.next = 5;
                break;

              case 15:
                return _context5.abrupt('return', res);

              case 16:
              case 'end':
                return _context5.stop();
            }
          }
        }, ref, this);
      }),
      map: regeneratorRuntime.mark(function map(o, f) {
        var res, operation;
        return regeneratorRuntime.wrap(function map$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                o = o.start;
                res = [];

              case 2:
                if (!(o != null)) {
                  _context6.next = 9;
                  break;
                }

                return _context6.delegateYield(this.getOperation(o), 't0', 4);

              case 4:
                operation = _context6.t0;

                if (!operation.deleted) {
                  res.push(f(operation));
                }
                o = operation.right;
                _context6.next = 2;
                break;

              case 9:
                return _context6.abrupt('return', res);

              case 10:
              case 'end':
                return _context6.stop();
            }
          }
        }, map, this);
      })
    },
    Map: {
      /*
        {
          map: {},
          struct: "Map",
          type: "",
          id: this.os.getNextOpId()
        }
      */
      encode: function encode(op) {
        return {
          struct: 'Map',
          type: op.type,
          id: op.id,
          map: {} // overwrite map!!
        };
      },
      requiredOps: function requiredOps() {
        return [];
      },
      execute: regeneratorRuntime.mark(function execute() {
        return regeneratorRuntime.wrap(function execute$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
              case 'end':
                return _context7.stop();
            }
          }
        }, execute, this);
      }),
      /*
        Get a property by name
      */
      get: regeneratorRuntime.mark(function get(op, name) {
        var oid, res;
        return regeneratorRuntime.wrap(function get$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                oid = op.map[name];

                if (!(oid != null)) {
                  _context8.next = 16;
                  break;
                }

                return _context8.delegateYield(this.getOperation(oid), 't0', 3);

              case 3:
                res = _context8.t0;

                if (!(res == null || res.deleted)) {
                  _context8.next = 8;
                  break;
                }

                _context8.t1 = void 0;
                _context8.next = 15;
                break;

              case 8:
                if (!(res.opContent == null)) {
                  _context8.next = 12;
                  break;
                }

                _context8.t2 = res.content;
                _context8.next = 14;
                break;

              case 12:
                return _context8.delegateYield(this.getType(res.opContent), 't3', 13);

              case 13:
                _context8.t2 = _context8.t3;

              case 14:
                _context8.t1 = _context8.t2;

              case 15:
                return _context8.abrupt('return', _context8.t1);

              case 16:
              case 'end':
                return _context8.stop();
            }
          }
        }, get, this);
      }),
      /*
        Delete a property by name
      */
      delete: regeneratorRuntime.mark(function _delete(op, name) {
        var v;
        return regeneratorRuntime.wrap(function _delete$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                v = op.map[name] || null;

                if (!(v != null)) {
                  _context9.next = 3;
                  break;
                }

                return _context9.delegateYield(Struct.Delete.create.call(this, {
                  target: v
                }), 't0', 3);

              case 3:
              case 'end':
                return _context9.stop();
            }
          }
        }, _delete, this);
      })
    }
  };
  Y.Struct = Struct;
};

},{}],7:[function(require,module,exports){
'use strict';

/*
  Partial definition of a transaction

  A transaction provides all the the async functionality on a database.

  By convention, a transaction has the following properties:
  * ss for StateSet
  * os for OperationStore
  * ds for DeleteStore

  A transaction must also define the following methods:
  * checkDeleteStoreForState(state)
    - When increasing the state of a user, an operation with an higher id
      may already be garbage collected, and therefore it will never be received.
      update the state to reflect this knowledge. This won't call a method to save the state!
  * getDeleteSet(id)
    - Get the delete set in a readable format:
      {
        "userX": [
          [5,1], // starting from position 5, one operations is deleted
          [9,4]  // starting from position 9, four operations are deleted
        ],
        "userY": ...
      }
  * getOpsFromDeleteSet(ds) -- TODO: just call this.deleteOperation(id) here
    - get a set of deletions that need to be applied in order to get to
      achieve the state of the supplied ds
  * setOperation(op)
    - write `op` to the database.
      Note: this is allowed to return an in-memory object.
      E.g. the Memory adapter returns the object that it has in-memory.
      Changing values on this object will be stored directly in the database
      without calling this function. Therefore,
      setOperation may have no functionality in some adapters. This also has
      implications on the way we use operations that were served from the database.
      We try not to call copyObject, if not necessary.
  * addOperation(op)
    - add an operation to the database.
      This may only be called once for every op.id
      Must return a function that returns the next operation in the database (ordered by id)
  * getOperation(id)
  * removeOperation(id)
    - remove an operation from the database. This is called when an operation
      is garbage collected.
  * setState(state)
    - `state` is of the form
      {
        user: "1",
        clock: 4
      } <- meaning that we have four operations from user "1"
           (with these id's respectively: 0, 1, 2, and 3)
  * getState(user)
  * getStateVector()
    - Get the state of the OS in the form
    [{
      user: "userX",
      clock: 11
    },
     ..
    ]
  * getStateSet()
    - Get the state of the OS in the form
    {
      "userX": 11,
      "userY": 22
    }
   * getOperations(startSS)
     - Get the all the operations that are necessary in order to achive the
       stateSet of this user, starting from a stateSet supplied by another user
   * makeOperationReady(ss, op)
     - this is called only by `getOperations(startSS)`. It makes an operation
       applyable on a given SS.
*/

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y) {
  var Transaction = (function () {
    function Transaction() {
      _classCallCheck(this, Transaction);
    }

    _createClass(Transaction, [{
      key: 'getType',

      /*
        Get a type based on the id of its model.
        If it does not exist yes, create it.
        TODO: delete type from store.initializedTypes[id] when corresponding id was deleted!
      */
      value: regeneratorRuntime.mark(function getType(id) {
        var sid, t, op;
        return regeneratorRuntime.wrap(function getType$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                sid = JSON.stringify(id);
                t = this.store.initializedTypes[sid];

                if (!(t == null)) {
                  _context.next = 9;
                  break;
                }

                return _context.delegateYield(this.getOperation(id), 't0', 4);

              case 4:
                op = _context.t0;

                if (!(op != null)) {
                  _context.next = 9;
                  break;
                }

                return _context.delegateYield(Y[op.type].initType.call(this, this.store, op), 't1', 7);

              case 7:
                t = _context.t1;

                this.store.initializedTypes[sid] = t;

              case 9:
                return _context.abrupt('return', t);

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, getType, this);
      })
      /*
        Apply operations that this user created (no remote ones!)
          * does not check for Struct.*.requiredOps()
          * also broadcasts it through the connector
      */

    }, {
      key: 'applyCreatedOperations',
      value: regeneratorRuntime.mark(function applyCreatedOperations(ops) {
        var send, i, op;
        return regeneratorRuntime.wrap(function applyCreatedOperations$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                send = [];
                i = 0;

              case 2:
                if (!(i < ops.length)) {
                  _context2.next = 9;
                  break;
                }

                op = ops[i];
                return _context2.delegateYield(this.store.tryExecute.call(this, op), 't0', 5);

              case 5:
                send.push(Y.Struct[op.struct].encode(op));

              case 6:
                i++;
                _context2.next = 2;
                break;

              case 9:
                if (!this.store.y.connector.isDisconnected()) {
                  // TODO: && !this.store.forwardAppliedOperations (but then i don't send delete ops)
                  // is connected, and this is not going to be send in addOperation
                  this.store.y.connector.broadcast({
                    type: 'update',
                    ops: send
                  });
                }

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, applyCreatedOperations, this);
      })
    }, {
      key: 'deleteList',
      value: regeneratorRuntime.mark(function deleteList(start) {
        return regeneratorRuntime.wrap(function deleteList$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!this.store.y.connector.isSynced) {
                  _context3.next = 12;
                  break;
                }

              case 1:
                if (!(start != null && this.store.y.connector.isSynced)) {
                  _context3.next = 10;
                  break;
                }

                return _context3.delegateYield(this.getOperation(start), 't0', 3);

              case 3:
                start = _context3.t0;

                start.gc = true;
                return _context3.delegateYield(this.setOperation(start), 't1', 6);

              case 6:
                // TODO: will always reset the parent..
                this.store.gc1.push(start.id);
                start = start.right;
                _context3.next = 1;
                break;

              case 10:
                _context3.next = 12;
                break;

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, deleteList, this);
      })

      /*
        Mark an operation as deleted, and add it to the GC, if possible.
      */

    }, {
      key: 'deleteOperation',

      // TODO: when not possible??? do later in (gcWhenSynced)
      value: regeneratorRuntime.mark(function deleteOperation(targetId, preventCallType) {
        var target, callType, name, left, right;
        return regeneratorRuntime.wrap(function deleteOperation$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.delegateYield(this.getOperation(targetId), 't0', 1);

              case 1:
                target = _context4.t0;
                callType = false;

                if (!(target == null || !target.deleted)) {
                  _context4.next = 5;
                  break;
                }

                return _context4.delegateYield(this.markDeleted(targetId), 't1', 5);

              case 5:
                if (!(target != null && target.gc == null)) {
                  _context4.next = 42;
                  break;
                }

                if (target.deleted) {
                  _context4.next = 23;
                  break;
                }

                callType = true;
                // set deleted & notify type
                target.deleted = true;
                /*
                if (!preventCallType) {
                  var type = this.store.initializedTypes[JSON.stringify(target.parent)]
                  if (type != null) {
                    yield* type._changed(this, {
                      struct: 'Delete',
                      target: targetId
                    })
                  }
                }
                */
                // delete containing lists

                if (!(target.start != null)) {
                  _context4.next = 12;
                  break;
                }

                return _context4.delegateYield(this.deleteList(target.start), 't2', 11);

              case 11:
                return _context4.delegateYield(this.deleteList(target.id), 't3', 12);

              case 12:
                if (!(target.map != null)) {
                  _context4.next = 20;
                  break;
                }

                _context4.t4 = regeneratorRuntime.keys(target.map);

              case 14:
                if ((_context4.t5 = _context4.t4()).done) {
                  _context4.next = 19;
                  break;
                }

                name = _context4.t5.value;
                return _context4.delegateYield(this.deleteList(target.map[name]), 't6', 17);

              case 17:
                _context4.next = 14;
                break;

              case 19:
                return _context4.delegateYield(this.deleteList(target.id), 't7', 20);

              case 20:
                if (!(target.opContent != null)) {
                  _context4.next = 23;
                  break;
                }

                return _context4.delegateYield(this.deleteOperation(target.opContent), 't8', 22);

              case 22:
                target.opContent = null;

              case 23:
                if (!(target.left != null)) {
                  _context4.next = 28;
                  break;
                }

                return _context4.delegateYield(this.getOperation(target.left), 't10', 25);

              case 25:
                _context4.t9 = _context4.t10;
                _context4.next = 29;
                break;

              case 28:
                _context4.t9 = null;

              case 29:
                left = _context4.t9;

                this.store.addToGarbageCollector(target, left);

                // set here because it was deleted and/or gc'd
                return _context4.delegateYield(this.setOperation(target), 't11', 32);

              case 32:
                if (!(target.right != null)) {
                  _context4.next = 37;
                  break;
                }

                return _context4.delegateYield(this.getOperation(target.right), 't13', 34);

              case 34:
                _context4.t12 = _context4.t13;
                _context4.next = 38;
                break;

              case 37:
                _context4.t12 = null;

              case 38:
                right = _context4.t12;

                if (!(right != null && this.store.addToGarbageCollector(right, target))) {
                  _context4.next = 41;
                  break;
                }

                return _context4.delegateYield(this.setOperation(right), 't14', 41);

              case 41:
                return _context4.abrupt('return', callType);

              case 42:
              case 'end':
                return _context4.stop();
            }
          }
        }, deleteOperation, this);
      })
      /*
        Mark an operation as deleted&gc'd
      */

    }, {
      key: 'markGarbageCollected',
      value: regeneratorRuntime.mark(function markGarbageCollected(id) {
        var n, newlen, prev, next;
        return regeneratorRuntime.wrap(function markGarbageCollected$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.delegateYield(this.markDeleted(id), 't0', 1);

              case 1:
                n = _context5.t0;

                if (n.gc) {
                  _context5.next = 25;
                  break;
                }

                if (!(n.id[1] < id[1])) {
                  _context5.next = 9;
                  break;
                }

                // un-extend left
                newlen = n.len - (id[1] - n.id[1]);

                n.len -= newlen;
                return _context5.delegateYield(this.ds.put(n), 't1', 7);

              case 7:
                n = { id: id, len: newlen, gc: false };
                return _context5.delegateYield(this.ds.put(n), 't2', 9);

              case 9:
                return _context5.delegateYield(this.ds.findPrev(id), 't3', 10);

              case 10:
                prev = _context5.t3;
                return _context5.delegateYield(this.ds.findNext(id), 't4', 12);

              case 12:
                next = _context5.t4;

                if (!(id[1] < n.id[1] + n.len - 1)) {
                  _context5.next = 16;
                  break;
                }

                return _context5.delegateYield(this.ds.put({ id: [id[0], id[1] + 1], len: n.len - 1, gc: false }), 't5', 15);

              case 15:
                n.len = 1;

              case 16:
                // set gc'd
                n.gc = true;
                // can extend left?

                if (!(prev != null && prev.gc && Y.utils.compareIds([prev.id[0], prev.id[1] + prev.len], n.id))) {
                  _context5.next = 21;
                  break;
                }

                prev.len += n.len;
                return _context5.delegateYield(this.ds.delete(n.id), 't6', 20);

              case 20:
                n = prev;
                // ds.put n here?

              case 21:
                if (!(next != null && next.gc && Y.utils.compareIds([n.id[0], n.id[1] + n.len], next.id))) {
                  _context5.next = 24;
                  break;
                }

                n.len += next.len;
                return _context5.delegateYield(this.ds.delete(next.id), 't7', 24);

              case 24:
                return _context5.delegateYield(this.ds.put(n), 't8', 25);

              case 25:
              case 'end':
                return _context5.stop();
            }
          }
        }, markGarbageCollected, this);
      })
      /*
        Mark an operation as deleted.
         returns the delete node
      */

    }, {
      key: 'markDeleted',
      value: regeneratorRuntime.mark(function markDeleted(id) {
        var n, next;
        return regeneratorRuntime.wrap(function markDeleted$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.delegateYield(this.ds.findWithUpperBound(id), 't0', 1);

              case 1:
                n = _context6.t0;

                if (!(n != null && n.id[0] === id[0])) {
                  _context6.next = 15;
                  break;
                }

                if (!(n.id[1] <= id[1] && id[1] < n.id[1] + n.len)) {
                  _context6.next = 7;
                  break;
                }

                return _context6.abrupt('return', n);

              case 7:
                if (!(n.id[1] + n.len === id[1] && !n.gc)) {
                  _context6.next = 11;
                  break;
                }

                // can extend existing deletion
                n.len++;
                _context6.next = 13;
                break;

              case 11:
                // cannot extend left
                n = { id: id, len: 1, gc: false };
                return _context6.delegateYield(this.ds.put(n), 't1', 13);

              case 13:
                _context6.next = 17;
                break;

              case 15:
                // cannot extend left
                n = { id: id, len: 1, gc: false };
                return _context6.delegateYield(this.ds.put(n), 't2', 17);

              case 17:
                return _context6.delegateYield(this.ds.findNext(n.id), 't3', 18);

              case 18:
                next = _context6.t3;

                if (!(next != null && Y.utils.compareIds([n.id[0], n.id[1] + n.len], next.id) && !next.gc)) {
                  _context6.next = 22;
                  break;
                }

                n.len = n.len + next.len;
                return _context6.delegateYield(this.ds.delete(next.id), 't4', 22);

              case 22:
                return _context6.delegateYield(this.ds.put(n), 't5', 23);

              case 23:
                return _context6.abrupt('return', n);

              case 24:
              case 'end':
                return _context6.stop();
            }
          }
        }, markDeleted, this);
      })
      /*
        Call this method when the client is connected&synced with the
        other clients (e.g. master). This will query the database for
        operations that can be gc'd and add them to the garbage collector.
      */

    }, {
      key: 'garbageCollectAfterSync',
      value: regeneratorRuntime.mark(function garbageCollectAfterSync() {
        return regeneratorRuntime.wrap(function garbageCollectAfterSync$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.delegateYield(this.os.iterate(this, null, null, regeneratorRuntime.mark(function _callee(op) {
                  var left;
                  return regeneratorRuntime.wrap(function _callee$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          if (!(op.deleted && op.left != null)) {
                            _context7.next = 4;
                            break;
                          }

                          return _context7.delegateYield(this.getOperation(op.left), 't0', 2);

                        case 2:
                          left = _context7.t0;

                          this.store.addToGarbageCollector(op, left);

                        case 4:
                        case 'end':
                          return _context7.stop();
                      }
                    }
                  }, _callee, this);
                })), 't0', 1);

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, garbageCollectAfterSync, this);
      })
      /*
        Really remove an op and all its effects.
        The complicated case here is the Insert operation:
        * reset left
        * reset right
        * reset parent.start
        * reset parent.end
        * reset origins of all right ops
      */

    }, {
      key: 'garbageCollectOperation',
      value: regeneratorRuntime.mark(function garbageCollectOperation(id) {
        var state, o, left, right, neworigin, neworigin_, i, ids, parent, setParent;
        return regeneratorRuntime.wrap(function garbageCollectOperation$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                this.store.addToDebug('yield* this.garbageCollectOperation(', id, ')');
                // check to increase the state of the respective user
                return _context9.delegateYield(this.getState(id[0]), 't0', 2);

              case 2:
                state = _context9.t0;

                if (!(state.clock === id[1])) {
                  _context9.next = 7;
                  break;
                }

                state.clock++;
                // also check if more expected operations were gc'd
                return _context9.delegateYield(this.checkDeleteStoreForState(state), 't1', 6);

              case 6:
                return _context9.delegateYield(this.setState(state), 't2', 7);

              case 7:
                return _context9.delegateYield(this.markGarbageCollected(id), 't3', 8);

              case 8:
                return _context9.delegateYield(this.getOperation(id), 't4', 9);

              case 9:
                o = _context9.t4;

                if (!(o != null)) {
                  _context9.next = 61;
                  break;
                }

                if (!(o.left != null)) {
                  _context9.next = 16;
                  break;
                }

                return _context9.delegateYield(this.getOperation(o.left), 't5', 13);

              case 13:
                left = _context9.t5;

                left.right = o.right;
                return _context9.delegateYield(this.setOperation(left), 't6', 16);

              case 16:
                if (!(o.right != null)) {
                  _context9.next = 53;
                  break;
                }

                return _context9.delegateYield(this.getOperation(o.right), 't7', 18);

              case 18:
                right = _context9.t7;

                right.left = o.left;

                if (!Y.utils.compareIds(right.origin, o.id)) {
                  _context9.next = 52;
                  break;
                }

                // rights origin is o
                // find new origin of right ops
                // origin is the first left deleted operation
                neworigin = o.left;

              case 22:
                if (!(neworigin != null)) {
                  _context9.next = 30;
                  break;
                }

                return _context9.delegateYield(this.getOperation(neworigin), 't8', 24);

              case 24:
                neworigin_ = _context9.t8;

                if (!neworigin_.deleted) {
                  _context9.next = 27;
                  break;
                }

                return _context9.abrupt('break', 30);

              case 27:
                neworigin = neworigin_.left;
                _context9.next = 22;
                break;

              case 30:

                // reset origin of right
                right.origin = neworigin;

                // reset origin of all right ops (except first right - duh!),
                // until you find origin pointer to the left of o

                if (!(right.right == null)) {
                  _context9.next = 35;
                  break;
                }

                _context9.t9 = null;
                _context9.next = 37;
                break;

              case 35:
                return _context9.delegateYield(this.getOperation(right.right), 't10', 36);

              case 36:
                _context9.t9 = _context9.t10;

              case 37:
                i = _context9.t9;
                ids = [o.id, o.right];

              case 39:
                if (!(i != null && ids.some(function (id) {
                  return Y.utils.compareIds(id, i.origin);
                }))) {
                  _context9.next = 52;
                  break;
                }

                if (!Y.utils.compareIds(i.origin, o.id)) {
                  _context9.next = 43;
                  break;
                }

                // reset origin of i
                i.origin = neworigin;
                return _context9.delegateYield(this.setOperation(i), 't11', 43);

              case 43:
                if (!(i.right == null)) {
                  _context9.next = 47;
                  break;
                }

                _context9.t12 = null;
                _context9.next = 49;
                break;

              case 47:
                return _context9.delegateYield(this.getOperation(i.right), 't13', 48);

              case 48:
                _context9.t12 = _context9.t13;

              case 49:
                i = _context9.t12;
                _context9.next = 39;
                break;

              case 52:
                return _context9.delegateYield(this.setOperation(right), 't14', 53);

              case 53:
                if (!(o.parent != null)) {
                  _context9.next = 60;
                  break;
                }

                return _context9.delegateYield(this.getOperation(o.parent), 't15', 55);

              case 55:
                parent = _context9.t15;
                setParent = false; // whether to save parent to the os

                if (o.parentSub != null) {
                  if (Y.utils.compareIds(parent.map[o.parentSub], o.id)) {
                    setParent = true;
                    parent.map[o.parentSub] = o.right;
                  }
                } else {
                  if (Y.utils.compareIds(parent.start, o.id)) {
                    // gc'd op is the start
                    setParent = true;
                    parent.start = o.right;
                  }
                  if (Y.utils.compareIds(parent.end, o.id)) {
                    // gc'd op is the end
                    setParent = true;
                    parent.end = o.left;
                  }
                }

                if (!setParent) {
                  _context9.next = 60;
                  break;
                }

                return _context9.delegateYield(this.setOperation(parent), 't16', 60);

              case 60:
                return _context9.delegateYield(this.removeOperation(o.id), 't17', 61);

              case 61:
              case 'end':
                return _context9.stop();
            }
          }
        }, garbageCollectOperation, this);
      })
    }, {
      key: 'checkDeleteStoreForState',
      value: regeneratorRuntime.mark(function checkDeleteStoreForState(state) {
        var n;
        return regeneratorRuntime.wrap(function checkDeleteStoreForState$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.delegateYield(this.ds.findWithUpperBound([state.user, state.clock]), 't0', 1);

              case 1:
                n = _context10.t0;

                if (n != null && n.id[0] === state.user && n.gc) {
                  state.clock = Math.max(state.clock, n.id[1] + n.len);
                }

              case 3:
              case 'end':
                return _context10.stop();
            }
          }
        }, checkDeleteStoreForState, this);
      })
      /*
        apply a delete set in order to get
        the state of the supplied ds
      */

    }, {
      key: 'applyDeleteSet',
      value: regeneratorRuntime.mark(function applyDeleteSet(ds) {
        var deletions, createDeletions, user, dv, pos, d, i, del, id, addOperation, ops;
        return regeneratorRuntime.wrap(function applyDeleteSet$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                createDeletions = function createDeletions(user, start, len, gc) {
                  for (var c = start; c < start + len; c++) {
                    deletions.push([user, c, gc]);
                  }
                };

                deletions = [];
                _context12.t0 = regeneratorRuntime.keys(ds);

              case 3:
                if ((_context12.t1 = _context12.t0()).done) {
                  _context12.next = 12;
                  break;
                }

                user = _context12.t1.value;
                dv = ds[user];
                pos = 0;
                d = dv[pos];
                return _context12.delegateYield(this.ds.iterate(this, [user, 0], [user, Number.MAX_VALUE], regeneratorRuntime.mark(function _callee2(n) {
                  var diff;
                  return regeneratorRuntime.wrap(function _callee2$(_context11) {
                    while (1) {
                      switch (_context11.prev = _context11.next) {
                        case 0:
                          if (!(d != null)) {
                            _context11.next = 10;
                            break;
                          }

                          diff = 0; // describe the diff of length in 1) and 2)

                          if (!(n.id[1] + n.len <= d[0])) {
                            _context11.next = 6;
                            break;
                          }

                          return _context11.abrupt('break', 10);

                        case 6:
                          if (d[0] < n.id[1]) {
                            // 2)
                            // delete maximum the len of d
                            // else delete as much as possible
                            diff = Math.min(n.id[1] - d[0], d[1]);
                            createDeletions(user, d[0], diff, d[2]);
                          } else {
                            // 3)
                            diff = n.id[1] + n.len - d[0]; // never null (see 1)
                            if (d[2] && !n.gc) {
                              // d marks as gc'd but n does not
                              // then delete either way
                              createDeletions(user, d[0], Math.min(diff, d[1]), d[2]);
                            }
                          }

                        case 7:
                          if (d[1] <= diff) {
                            // d doesn't delete anything anymore
                            d = dv[++pos];
                          } else {
                            d[0] = d[0] + diff; // reset pos
                            d[1] = d[1] - diff; // reset length
                          }
                          _context11.next = 0;
                          break;

                        case 10:
                        case 'end':
                          return _context11.stop();
                      }
                    }
                  }, _callee2, this);
                })), 't2', 9);

              case 9:
                // for the rest.. just apply it
                for (; pos < dv.length; pos++) {
                  d = dv[pos];
                  createDeletions(user, d[0], d[1], d[2]);
                }
                _context12.next = 3;
                break;

              case 12:
                _context12.t3 = regeneratorRuntime.keys(deletions);

              case 13:
                if ((_context12.t4 = _context12.t3()).done) {
                  _context12.next = 25;
                  break;
                }

                i = _context12.t4.value;
                del = deletions[i];
                id = [del[0], del[1]];
                // always try to delete..

                return _context12.delegateYield(this.deleteOperation(id), 't5', 18);

              case 18:
                addOperation = _context12.t5;

                if (!addOperation) {
                  _context12.next = 21;
                  break;
                }

                return _context12.delegateYield(this.store.operationAdded(this, { struct: 'Delete', target: id }), 't6', 21);

              case 21:
                if (!del[2]) {
                  _context12.next = 23;
                  break;
                }

                return _context12.delegateYield(this.garbageCollectOperation(id), 't7', 23);

              case 23:
                _context12.next = 13;
                break;

              case 25:
                if (this.store.forwardAppliedOperations) {
                  ops = deletions.map(function (d) {
                    return { struct: 'Delete', target: [d[0], d[1]] };
                  });

                  this.store.y.connector.broadcast({
                    type: 'update',
                    ops: ops
                  });
                }

              case 26:
              case 'end':
                return _context12.stop();
            }
          }
        }, applyDeleteSet, this);
      })
    }, {
      key: 'isGarbageCollected',
      value: regeneratorRuntime.mark(function isGarbageCollected(id) {
        var n;
        return regeneratorRuntime.wrap(function isGarbageCollected$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                return _context13.delegateYield(this.ds.findWithUpperBound(id), 't0', 1);

              case 1:
                n = _context13.t0;
                return _context13.abrupt('return', n != null && n.id[0] === id[0] && id[1] < n.id[1] + n.len && n.gc);

              case 3:
              case 'end':
                return _context13.stop();
            }
          }
        }, isGarbageCollected, this);
      })
      /*
        A DeleteSet (ds) describes all the deleted ops in the OS
      */

    }, {
      key: 'getDeleteSet',
      value: regeneratorRuntime.mark(function getDeleteSet() {
        var ds;
        return regeneratorRuntime.wrap(function getDeleteSet$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                ds = {};
                return _context15.delegateYield(this.ds.iterate(this, null, null, regeneratorRuntime.mark(function _callee3(n) {
                  var user, counter, len, gc, dv;
                  return regeneratorRuntime.wrap(function _callee3$(_context14) {
                    while (1) {
                      switch (_context14.prev = _context14.next) {
                        case 0:
                          user = n.id[0];
                          counter = n.id[1];
                          len = n.len;
                          gc = n.gc;
                          dv = ds[user];

                          if (dv === void 0) {
                            dv = [];
                            ds[user] = dv;
                          }
                          dv.push([counter, len, gc]);

                        case 7:
                        case 'end':
                          return _context14.stop();
                      }
                    }
                  }, _callee3, this);
                })), 't0', 2);

              case 2:
                return _context15.abrupt('return', ds);

              case 3:
              case 'end':
                return _context15.stop();
            }
          }
        }, getDeleteSet, this);
      })
    }, {
      key: 'isDeleted',
      value: regeneratorRuntime.mark(function isDeleted(id) {
        var n;
        return regeneratorRuntime.wrap(function isDeleted$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                return _context16.delegateYield(this.ds.findWithUpperBound(id), 't0', 1);

              case 1:
                n = _context16.t0;
                return _context16.abrupt('return', n != null && n.id[0] === id[0] && id[1] < n.id[1] + n.len);

              case 3:
              case 'end':
                return _context16.stop();
            }
          }
        }, isDeleted, this);
      })
    }, {
      key: 'setOperation',
      value: regeneratorRuntime.mark(function setOperation(op) {
        return regeneratorRuntime.wrap(function setOperation$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                return _context17.delegateYield(this.os.put(op), 't0', 1);

              case 1:
                return _context17.abrupt('return', op);

              case 2:
              case 'end':
                return _context17.stop();
            }
          }
        }, setOperation, this);
      })
    }, {
      key: 'addOperation',
      value: regeneratorRuntime.mark(function addOperation(op) {
        return regeneratorRuntime.wrap(function addOperation$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                return _context18.delegateYield(this.os.put(op), 't0', 1);

              case 1:
                if (!this.store.y.connector.isDisconnected() && this.store.forwardAppliedOperations) {
                  // is connected, and this is not going to be send in addOperation
                  this.store.y.connector.broadcast({
                    type: 'update',
                    ops: [op]
                  });
                }

              case 2:
              case 'end':
                return _context18.stop();
            }
          }
        }, addOperation, this);
      })
    }, {
      key: 'getOperation',
      value: regeneratorRuntime.mark(function getOperation(id) {
        return regeneratorRuntime.wrap(function getOperation$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                return _context19.delegateYield(this.os.find(id), 't0', 1);

              case 1:
                return _context19.abrupt('return', _context19.t0);

              case 2:
              case 'end':
                return _context19.stop();
            }
          }
        }, getOperation, this);
      })
    }, {
      key: 'removeOperation',
      value: regeneratorRuntime.mark(function removeOperation(id) {
        return regeneratorRuntime.wrap(function removeOperation$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                return _context20.delegateYield(this.os.delete(id), 't0', 1);

              case 1:
              case 'end':
                return _context20.stop();
            }
          }
        }, removeOperation, this);
      })
    }, {
      key: 'setState',
      value: regeneratorRuntime.mark(function setState(state) {
        var val;
        return regeneratorRuntime.wrap(function setState$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                val = {
                  id: [state.user],
                  clock: state.clock
                };
                // TODO: find a way to skip this step.. (after implementing some dbs..)

                return _context21.delegateYield(this.ss.find([state.user]), 't0', 2);

              case 2:
                if (!_context21.t0) {
                  _context21.next = 6;
                  break;
                }

                return _context21.delegateYield(this.ss.put(val), 't1', 4);

              case 4:
                _context21.next = 7;
                break;

              case 6:
                return _context21.delegateYield(this.ss.put(val), 't2', 7);

              case 7:
              case 'end':
                return _context21.stop();
            }
          }
        }, setState, this);
      })
    }, {
      key: 'getState',
      value: regeneratorRuntime.mark(function getState(user) {
        var n, clock;
        return regeneratorRuntime.wrap(function getState$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                return _context22.delegateYield(this.ss.find([user]), 't0', 1);

              case 1:
                _context22.t1 = n = _context22.t0;

                if (!(_context22.t1 == null)) {
                  _context22.next = 6;
                  break;
                }

                _context22.t2 = null;
                _context22.next = 7;
                break;

              case 6:
                _context22.t2 = n.clock;

              case 7:
                clock = _context22.t2;

                if (clock == null) {
                  clock = 0;
                }
                return _context22.abrupt('return', {
                  user: user,
                  clock: clock
                });

              case 10:
              case 'end':
                return _context22.stop();
            }
          }
        }, getState, this);
      })
    }, {
      key: 'getStateVector',
      value: regeneratorRuntime.mark(function getStateVector() {
        var stateVector;
        return regeneratorRuntime.wrap(function getStateVector$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                stateVector = [];
                return _context24.delegateYield(this.ss.iterate(this, null, null, regeneratorRuntime.mark(function _callee4(n) {
                  return regeneratorRuntime.wrap(function _callee4$(_context23) {
                    while (1) {
                      switch (_context23.prev = _context23.next) {
                        case 0:
                          stateVector.push({
                            user: n.id[0],
                            clock: n.clock
                          });

                        case 1:
                        case 'end':
                          return _context23.stop();
                      }
                    }
                  }, _callee4, this);
                })), 't0', 2);

              case 2:
                return _context24.abrupt('return', stateVector);

              case 3:
              case 'end':
                return _context24.stop();
            }
          }
        }, getStateVector, this);
      })
    }, {
      key: 'getStateSet',
      value: regeneratorRuntime.mark(function getStateSet() {
        var ss;
        return regeneratorRuntime.wrap(function getStateSet$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                ss = {};
                return _context26.delegateYield(this.ss.iterate(this, null, null, regeneratorRuntime.mark(function _callee5(n) {
                  return regeneratorRuntime.wrap(function _callee5$(_context25) {
                    while (1) {
                      switch (_context25.prev = _context25.next) {
                        case 0:
                          ss[n.id[0]] = n.clock;

                        case 1:
                        case 'end':
                          return _context25.stop();
                      }
                    }
                  }, _callee5, this);
                })), 't0', 2);

              case 2:
                return _context26.abrupt('return', ss);

              case 3:
              case 'end':
                return _context26.stop();
            }
          }
        }, getStateSet, this);
      })
    }, {
      key: 'getOperations',
      value: regeneratorRuntime.mark(function getOperations(startSS) {
        var ops, endSV, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, endState, user, startPos, res, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, op;

        return regeneratorRuntime.wrap(function getOperations$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                // TODO: use bounds here!
                if (startSS == null) {
                  startSS = {};
                }
                ops = [];
                return _context28.delegateYield(this.getStateVector(), 't0', 3);

              case 3:
                endSV = _context28.t0;
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context28.prev = 7;
                _iterator = endSV[Symbol.iterator]();

              case 9:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context28.next = 19;
                  break;
                }

                endState = _step.value;
                user = endState.user;

                if (!(user === '_')) {
                  _context28.next = 14;
                  break;
                }

                return _context28.abrupt('continue', 16);

              case 14:
                startPos = startSS[user] || 0;
                return _context28.delegateYield(this.os.iterate(this, [user, startPos], [user, Number.MAX_VALUE], regeneratorRuntime.mark(function _callee6(op) {
                  return regeneratorRuntime.wrap(function _callee6$(_context27) {
                    while (1) {
                      switch (_context27.prev = _context27.next) {
                        case 0:
                          ops.push(op);

                        case 1:
                        case 'end':
                          return _context27.stop();
                      }
                    }
                  }, _callee6, this);
                })), 't1', 16);

              case 16:
                _iteratorNormalCompletion = true;
                _context28.next = 9;
                break;

              case 19:
                _context28.next = 25;
                break;

              case 21:
                _context28.prev = 21;
                _context28.t2 = _context28['catch'](7);
                _didIteratorError = true;
                _iteratorError = _context28.t2;

              case 25:
                _context28.prev = 25;
                _context28.prev = 26;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 28:
                _context28.prev = 28;

                if (!_didIteratorError) {
                  _context28.next = 31;
                  break;
                }

                throw _iteratorError;

              case 31:
                return _context28.finish(28);

              case 32:
                return _context28.finish(25);

              case 33:
                res = [];
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context28.prev = 37;
                _iterator2 = ops[Symbol.iterator]();

              case 39:
                if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                  _context28.next = 48;
                  break;
                }

                op = _step2.value;
                _context28.t3 = res;
                return _context28.delegateYield(this.makeOperationReady(startSS, op), 't4', 43);

              case 43:
                _context28.t5 = _context28.t4;

                _context28.t3.push.call(_context28.t3, _context28.t5);

              case 45:
                _iteratorNormalCompletion2 = true;
                _context28.next = 39;
                break;

              case 48:
                _context28.next = 54;
                break;

              case 50:
                _context28.prev = 50;
                _context28.t6 = _context28['catch'](37);
                _didIteratorError2 = true;
                _iteratorError2 = _context28.t6;

              case 54:
                _context28.prev = 54;
                _context28.prev = 55;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 57:
                _context28.prev = 57;

                if (!_didIteratorError2) {
                  _context28.next = 60;
                  break;
                }

                throw _iteratorError2;

              case 60:
                return _context28.finish(57);

              case 61:
                return _context28.finish(54);

              case 62:
                return _context28.abrupt('return', res);

              case 63:
              case 'end':
                return _context28.stop();
            }
          }
        }, getOperations, this, [[7, 21, 25, 33], [26,, 28, 32], [37, 50, 54, 62], [55,, 57, 61]]);
      })
      /*
        Here, we make op executable for the receiving user.
         Notes:
          startSS: denotes to the SV that the remote user sent
          currSS:  denotes to the state vector that the user should have if he
                   applies all already sent operations (increases is each step)
         We face several problems:
        * Execute op as is won't work because ops depend on each other
         -> find a way so that they do not anymore
        * When changing left, must not go more to the left than the origin
        * When changing right, you have to consider that other ops may have op
          as their origin, this means that you must not set one of these ops
          as the new right (interdependencies of ops)
        * can't just go to the right until you find the first known operation,
          With currSS
            -> interdependency of ops is a problem
          With startSS
            -> leads to inconsistencies when two users join at the same time.
               Then the position depends on the order of execution -> error!
           Solution:
          -> re-create originial situation
            -> set op.left = op.origin (which never changes)
            -> set op.right
                 to the first operation that is known (according to startSS)
                 or to the first operation that has an origin that is not to the
                 right of op.
            -> Enforces unique execution order -> happy user
           Improvements: TODO
            * Could set left to origin, or the first known operation
              (startSS or currSS.. ?)
              -> Could be necessary when I turn GC again.
              -> Is a bad(ish) idea because it requires more computation
      */

    }, {
      key: 'makeOperationReady',
      value: regeneratorRuntime.mark(function makeOperationReady(startSS, op) {
        var o, ids, right;
        return regeneratorRuntime.wrap(function makeOperationReady$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                op = Y.Struct[op.struct].encode(op);
                op = Y.utils.copyObject(op);
                o = op;
                ids = [op.id];
                // search for the new op.right
                // it is either the first known op (according to startSS)
                // or the o that has no origin to the right of op
                // (this is why we use the ids array)

              case 4:
                if (!(o.right != null)) {
                  _context29.next = 13;
                  break;
                }

                return _context29.delegateYield(this.getOperation(o.right), 't0', 6);

              case 6:
                right = _context29.t0;

                if (!(o.right[1] < (startSS[o.right[0]] || 0) || !ids.some(function (id) {
                  return Y.utils.compareIds(id, right.origin);
                }))) {
                  _context29.next = 9;
                  break;
                }

                return _context29.abrupt('break', 13);

              case 9:
                ids.push(o.right);
                o = right;
                _context29.next = 4;
                break;

              case 13:
                op.right = o.right;
                op.left = op.origin;
                return _context29.abrupt('return', op);

              case 16:
              case 'end':
                return _context29.stop();
            }
          }
        }, makeOperationReady, this);
      })
    }]);

    return Transaction;
  })();

  Y.Transaction = Transaction;
};

},{}],8:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y) {
  var YMap = (function () {
    function YMap(os, model, contents, opContents) {
      var _this = this;

      _classCallCheck(this, YMap);

      this._model = model.id;
      this.os = os;
      this.map = Y.utils.copyObject(model.map);
      this.contents = contents;
      this.opContents = opContents;
      this.eventHandler = new Y.utils.EventHandler(function (ops) {
        var userEvents = [];
        for (var i in ops) {
          var op = ops[i];
          var oldValue;
          // key is the name to use to access (op)content
          var key = op.struct === 'Delete' ? op.key : op.parentSub;

          // compute oldValue
          if (_this.opContents[key] != null) {
            (function () {
              var prevType = _this.opContents[key];
              oldValue = function () {
                // eslint-disable-line
                return new Promise(function (resolve) {
                  _this.os.requestTransaction(regeneratorRuntime.mark(function _callee() {
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            return _context.delegateYield(this.getType(prevType), 't0', 1);

                          case 1:
                            _context.t1 = _context.t0;
                            resolve(_context.t1);

                          case 3:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, this);
                  }));
                });
              };
            })();
          } else {
            oldValue = _this.contents[key];
          }
          // compute op event
          if (op.struct === 'Insert') {
            if (op.left === null) {
              if (op.opContent != null) {
                delete _this.contents[key];
                if (op.deleted) {
                  delete _this.opContents[key];
                } else {
                  _this.opContents[key] = op.opContent;
                }
              } else {
                delete _this.opContents[key];
                if (op.deleted) {
                  delete _this.contents[key];
                } else {
                  _this.contents[key] = op.content;
                }
              }
              _this.map[key] = op.id;
              var insertEvent = {
                name: key,
                object: _this
              };
              if (oldValue === undefined) {
                insertEvent.type = 'add';
              } else {
                insertEvent.type = 'update';
                insertEvent.oldValue = oldValue;
              }
              userEvents.push(insertEvent);
            }
          } else if (op.struct === 'Delete') {
            if (Y.utils.compareIds(_this.map[key], op.target)) {
              delete _this.opContents[key];
              delete _this.contents[key];
              var deleteEvent = {
                name: key,
                object: _this,
                oldValue: oldValue,
                type: 'delete'
              };
              userEvents.push(deleteEvent);
            }
          } else {
            throw new Error('Unexpected Operation!');
          }
        }
        _this.eventHandler.callEventListeners(userEvents);
      });
    }

    _createClass(YMap, [{
      key: 'get',
      value: function get(key) {
        var _this2 = this;

        // return property.
        // if property does not exist, return null
        // if property is a type, return a promise
        if (key == null) {
          throw new Error('You must specify key!');
        }
        if (this.opContents[key] == null) {
          return this.contents[key];
        } else {
          return new Promise(function (resolve) {
            var oid = _this2.opContents[key];
            _this2.os.requestTransaction(regeneratorRuntime.mark(function _callee2() {
              return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      return _context2.delegateYield(this.getType(oid), 't0', 1);

                    case 1:
                      _context2.t1 = _context2.t0;
                      resolve(_context2.t1);

                    case 3:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, this);
            }));
          });
        }
      }
      /*
        If there is a primitive (not a custom type), then return it.
        Returns all primitive values, if propertyName is specified!
        Note: modifying the return value could result in inconsistencies!
          -- so make sure to copy it first!
      */

    }, {
      key: 'getPrimitive',
      value: function getPrimitive(key) {
        if (key == null) {
          return Y.utils.copyObject(this.contents);
        } else {
          return this.contents[key];
        }
      }
    }, {
      key: 'delete',
      value: function _delete(key) {
        var right = this.map[key];
        if (right != null) {
          var del = {
            target: right,
            struct: 'Delete'
          };
          var eventHandler = this.eventHandler;
          var modDel = Y.utils.copyObject(del);
          modDel.key = key;
          eventHandler.awaitAndPrematurelyCall([modDel]);
          this.os.requestTransaction(regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    return _context3.delegateYield(this.applyCreatedOperations([del]), 't0', 1);

                  case 1:
                    eventHandler.awaitedDeletes(1);

                  case 2:
                  case 'end':
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));
        }
      }
    }, {
      key: 'set',
      value: function set(key, value) {
        var _this3 = this;

        // set property.
        // if property is a type, return a promise
        // if not, apply immediately on this type an call event

        var right = this.map[key] || null;
        var insert = {
          left: null,
          right: right,
          origin: null,
          parent: this._model,
          parentSub: key,
          struct: 'Insert'
        };
        return new Promise(function (resolve) {
          if (value instanceof Y.utils.CustomType) {
            // construct a new type
            _this3.os.requestTransaction(regeneratorRuntime.mark(function _callee4() {
              var typeid, type;
              return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      return _context4.delegateYield(value.createType.call(this), 't0', 1);

                    case 1:
                      typeid = _context4.t0;
                      return _context4.delegateYield(this.getType(typeid), 't1', 3);

                    case 3:
                      type = _context4.t1;

                      insert.opContent = typeid;
                      insert.id = this.store.getNextOpId();
                      return _context4.delegateYield(this.applyCreatedOperations([insert]), 't2', 7);

                    case 7:
                      resolve(type);

                    case 8:
                    case 'end':
                      return _context4.stop();
                  }
                }
              }, _callee4, this);
            }));
          } else {
            insert.content = value;
            insert.id = _this3.os.getNextOpId();
            var eventHandler = _this3.eventHandler;
            eventHandler.awaitAndPrematurelyCall([insert]);

            _this3.os.requestTransaction(regeneratorRuntime.mark(function _callee5() {
              return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      return _context5.delegateYield(this.applyCreatedOperations([insert]), 't0', 1);

                    case 1:
                      eventHandler.awaitedInserts(1);

                    case 2:
                    case 'end':
                      return _context5.stop();
                  }
                }
              }, _callee5, this);
            }));
            resolve(value);
          }
        });
      }
    }, {
      key: 'observe',
      value: function observe(f) {
        this.eventHandler.addEventListener(f);
      }
    }, {
      key: 'unobserve',
      value: function unobserve(f) {
        this.eventHandler.removeEventListener(f);
      }
      /*
        Observe a path.
         E.g.
        ```
        o.set('textarea', Y.TextBind)
        o.observePath(['textarea'], function(t){
          // is called whenever textarea is replaced
          t.bind(textarea)
        })
         returns a Promise that contains a function that removes the observer from the path.
      */

    }, {
      key: 'observePath',
      value: function observePath(path, f) {
        var self = this;
        function observeProperty(events) {
          // call f whenever path changes
          for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (event.name === propertyName) {
              // call this also for delete events!
              var property = self.get(propertyName);
              if (property instanceof Promise) {
                property.then(f);
              } else {
                f(property);
              }
            }
          }
        }

        if (path.length < 1) {
          throw new Error('Path must contain at least one element!');
        } else if (path.length === 1) {
          var propertyName = path[0];
          var property = self.get(propertyName);
          if (property instanceof Promise) {
            property.then(f);
          } else {
            f(property);
          }
          this.observe(observeProperty);
          return Promise.resolve(function () {
            self.unobserve(f);
          });
        } else {
          var deleteChildObservers;
          var resetObserverPath = function resetObserverPath() {
            var promise = self.get(path[0]);
            if (!promise instanceof Promise) {
              // its either not defined or a primitive value
              promise = self.set(path[0], Y.Map);
            }
            return promise.then(function (map) {
              return map.observePath(path.slice(1), f);
            }).then(function (_deleteChildObservers) {
              // update deleteChildObservers
              deleteChildObservers = _deleteChildObservers;
              return Promise.resolve(); // Promise does not return anything
            });
          };
          var observer = function observer(events) {
            for (var e in events) {
              var event = events[e];
              if (event.name === path[0]) {
                deleteChildObservers();
                if (event.type === 'add' || event.type === 'update') {
                  resetObserverPath();
                }
                // TODO: what about the delete events?
              }
            }
          };
          self.observe(observer);
          return resetObserverPath().then(
          // this promise contains a function that deletes all the child observers
          // and how to unobserve the observe from this object
          Promise.resolve(function () {
            deleteChildObservers();
            self.unobserve(observer);
          }));
        }
      }
    }, {
      key: '_changed',
      value: regeneratorRuntime.mark(function _changed(transaction, op) {
        return regeneratorRuntime.wrap(function _changed$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(op.struct === 'Delete')) {
                  _context6.next = 3;
                  break;
                }

                return _context6.delegateYield(transaction.getOperation(op.target), 't0', 2);

              case 2:
                op.key = _context6.t0.parentSub;

              case 3:
                this.eventHandler.receivedOp(op);

              case 4:
              case 'end':
                return _context6.stop();
            }
          }
        }, _changed, this);
      })
    }]);

    return YMap;
  })();

  Y.Map = new Y.utils.CustomType({
    class: YMap,
    createType: regeneratorRuntime.mark(function YMapCreator() {
      var modelid, model;
      return regeneratorRuntime.wrap(function YMapCreator$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              modelid = this.store.getNextOpId();
              model = {
                map: {},
                struct: 'Map',
                type: 'Map',
                id: modelid
              };
              return _context7.delegateYield(this.applyCreatedOperations([model]), 't0', 3);

            case 3:
              return _context7.abrupt('return', modelid);

            case 4:
            case 'end':
              return _context7.stop();
          }
        }
      }, YMapCreator, this);
    }),
    initType: regeneratorRuntime.mark(function YMapInitializer(os, model) {
      var contents, opContents, map, name, op;
      return regeneratorRuntime.wrap(function YMapInitializer$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              contents = {};
              opContents = {};
              map = model.map;
              _context8.t0 = regeneratorRuntime.keys(map);

            case 4:
              if ((_context8.t1 = _context8.t0()).done) {
                _context8.next = 11;
                break;
              }

              name = _context8.t1.value;
              return _context8.delegateYield(this.getOperation(map[name]), 't2', 7);

            case 7:
              op = _context8.t2;

              if (op.opContent != null) {
                opContents[name] = op.opContent;
              } else {
                contents[name] = op.content;
              }
              _context8.next = 4;
              break;

            case 11:
              return _context8.abrupt('return', new YMap(os, model, contents, opContents));

            case 12:
            case 'end':
              return _context8.stop();
          }
        }
      }, YMapInitializer, this);
    })
  });
};

},{}],9:[function(require,module,exports){
'use strict';

/*
  EventHandler is an helper class for constructing custom types.

  Why: When constructing custom types, you sometimes want your types to work
  synchronous: E.g.
  ``` Synchronous
  mytype.setSomething("yay")
  mytype.getSomething() === "yay"
  ```
  ``` Asynchronous
  mytype.setSomething("yay")
  mytype.getSomething() === undefined
  mytype.waitForSomething().then(function(){
    mytype.getSomething() === "yay"
  })

  The structures usually work asynchronously (you have to wait for the
  database request to finish). EventHandler will help you to make your type
  synchronously.
*/

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (Y) {
  Y.utils = {};

  var EventHandler = (function () {
    /*
      onevent: is called when the structure changes.
       Note: "awaiting opertations" is used to denote operations that were
      prematurely called. Events for received operations can not be executed until
      all prematurely called operations were executed ("waiting operations")
    */

    function EventHandler(onevent) {
      _classCallCheck(this, EventHandler);

      this.waiting = [];
      this.awaiting = 0;
      this.onevent = onevent;
      this.eventListeners = [];
    }
    /*
      Call this when a new operation arrives. It will be executed right away if
      there are no waiting operations, that you prematurely executed
    */

    _createClass(EventHandler, [{
      key: 'receivedOp',
      value: function receivedOp(op) {
        if (this.awaiting <= 0) {
          this.onevent([op]);
        } else {
          this.waiting.push(Y.utils.copyObject(op));
        }
      }
      /*
        You created some operations, and you want the `onevent` function to be
        called right away. Received operations will not be executed untill all
        prematurely called operations are executed
      */

    }, {
      key: 'awaitAndPrematurelyCall',
      value: function awaitAndPrematurelyCall(ops) {
        this.awaiting++;
        this.onevent(ops);
      }
      /*
        Basic event listener boilerplate...
        TODO: maybe put this in a different type..
      */

    }, {
      key: 'addEventListener',
      value: function addEventListener(f) {
        this.eventListeners.push(f);
      }
    }, {
      key: 'removeEventListener',
      value: function removeEventListener(f) {
        this.eventListeners = this.eventListeners.filter(function (g) {
          return f !== g;
        });
      }
    }, {
      key: 'removeAllEventListeners',
      value: function removeAllEventListeners() {
        this.eventListeners = [];
      }
    }, {
      key: 'callEventListeners',
      value: function callEventListeners(event) {
        for (var i in this.eventListeners) {
          try {
            this.eventListeners[i](event);
          } catch (e) {
            console.log('User events must not throw Errors!'); // eslint-disable-line
          }
        }
      }
      /*
        Call this when you successfully awaited the execution of n Insert operations
      */

    }, {
      key: 'awaitedInserts',
      value: function awaitedInserts(n) {
        var ops = this.waiting.splice(this.waiting.length - n);
        for (var oid = 0; oid < ops.length; oid++) {
          var op = ops[oid];
          for (var i = this.waiting.length - 1; i >= 0; i--) {
            var w = this.waiting[i];
            if (Y.utils.compareIds(op.left, w.id)) {
              // include the effect of op in w
              w.right = op.id;
              // exclude the effect of w in op
              op.left = w.left;
            } else if (Y.utils.compareIds(op.right, w.id)) {
              // similar..
              w.left = op.id;
              op.right = w.right;
            }
          }
        }
        this._tryCallEvents();
      }
      /*
        Call this when you successfully awaited the execution of n Delete operations
      */

    }, {
      key: 'awaitedDeletes',
      value: function awaitedDeletes(n, newLeft) {
        var ops = this.waiting.splice(this.waiting.length - n);
        for (var j in ops) {
          var del = ops[j];
          if (newLeft != null) {
            for (var i in this.waiting) {
              var w = this.waiting[i];
              // We will just care about w.left
              if (Y.utils.compareIds(del.target, w.left)) {
                del.left = newLeft;
              }
            }
          }
        }
        this._tryCallEvents();
      }
      /* (private)
        Try to execute the events for the waiting operations
      */

    }, {
      key: '_tryCallEvents',
      value: function _tryCallEvents() {
        this.awaiting--;
        if (this.awaiting <= 0 && this.waiting.length > 0) {
          var events = this.waiting;
          this.waiting = [];
          this.onevent(events);
        }
      }
    }]);

    return EventHandler;
  })();

  Y.utils.EventHandler = EventHandler;

  /*
    A wrapper for the definition of a custom type.
    Every custom type must have three properties:
     * createType
      - Defines the model of a newly created custom type and returns the type
    * initType
      - Given a model, creates a custom type
    * class
      - the constructor of the custom type (e.g. in order to inherit from a type)
  */

  var CustomType = // eslint-disable-line
  function CustomType(def) {
    _classCallCheck(this, CustomType);

    if (def.createType == null || def.initType == null || def.class == null) {
      throw new Error('Custom type was not initialized correctly!');
    }
    this.createType = def.createType;
    this.initType = def.initType;
    this.class = def.class;
  };

  Y.utils.CustomType = CustomType;

  /*
    Make a flat copy of an object
    (just copy properties)
  */
  function copyObject(o) {
    var c = {};
    for (var key in o) {
      c[key] = o[key];
    }
    return c;
  }
  Y.utils.copyObject = copyObject;

  /*
    Defines a smaller relation on Id's
  */
  function smaller(a, b) {
    return a[0] < b[0] || a[0] === b[0] && a[1] < b[1];
  }
  Y.utils.smaller = smaller;

  function compareIds(id1, id2) {
    if (id1 == null || id2 == null) {
      if (id1 == null && id2 == null) {
        return true;
      }
      return false;
    }
    if (id1[0] === id2[0] && id1[1] === id2[1]) {
      return true;
    } else {
      return false;
    }
  }
  Y.utils.compareIds = compareIds;
};

},{}],10:[function(require,module,exports){
/* @flow */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('./Connector.js')(Y);
require('./Database.js')(Y);
require('./Transaction.js')(Y);
require('./Struct.js')(Y);
require('./Utils.js')(Y);
require('./Connectors/Test.js')(Y);

var requiringModules = {};

module.exports = Y;

Y.extend = function (name, value) {
  Y[name] = value;
  if (requiringModules[name] != null) {
    requiringModules[name].resolve();
    delete requiringModules[name];
  }
};

Y.requestModules = function (modules) {
  var promises = [];
  for (var i = 0; i < modules.length; i++) {
    var modulename = 'y-' + modules[i].toLowerCase();
    if (Y[modules[i]] == null) {
      if (requiringModules[modules[i]] == null) {
        try {
          require(modulename)(Y);
        } catch (e) {
          // module does not exist
          if (typeof window !== 'undefined') {
            var imported;

            (function () {
              imported = document.createElement('script');

              imported.src = Y.sourceDir + '/' + modulename + '/' + modulename + '.js';
              document.head.appendChild(imported);

              var requireModule = {};
              requiringModules[modules[i]] = requireModule;
              requireModule.promise = new Promise(function (resolve) {
                requireModule.resolve = resolve;
              });
              promises.push(requireModule.promise);
            })();
          } else {
            throw e;
          }
        }
      } else {
        promises.push(requiringModules[modules[i]].promise);
      }
    }
  }
  return Promise.all(promises);
};

require('./Types/Map.js')(Y);

function Y(opts) {
  opts.types = opts.types != null ? opts.types : [];
  var modules = [opts.db.name, opts.connector.name].concat(opts.types);
  Y.sourceDir = opts.sourceDir;
  return Y.requestModules(modules).then(function () {
    return new Promise(function (resolve) {
      var yconfig = new YConfig(opts, function () {
        yconfig.db.whenUserIdSet(function () {
          resolve(yconfig);
        });
      });
    });
  });
}

var YConfig = (function () {
  function YConfig(opts, callback) {
    _classCallCheck(this, YConfig);

    this.db = new Y[opts.db.name](this, opts.db);
    this.connector = new Y[opts.connector.name](this, opts.connector);
    this.db.requestTransaction(regeneratorRuntime.mark(function requestTransaction() {
      var model, root;
      return regeneratorRuntime.wrap(function requestTransaction$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // create initial Map type
              model = {
                id: ['_', 0],
                struct: 'Map',
                type: 'Map',
                map: {}
              };
              return _context.delegateYield(this.store.tryExecute.call(this, model), 't0', 2);

            case 2:
              return _context.delegateYield(this.getType(model.id), 't1', 3);

            case 3:
              root = _context.t1;

              this.store.y.root = root;
              callback();

            case 6:
            case 'end':
              return _context.stop();
          }
        }
      }, requestTransaction, this);
    }));
  }

  _createClass(YConfig, [{
    key: 'isConnected',
    value: function isConnected() {
      return this.connector.isSynced;
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      return this.connector.disconnect();
    }
  }, {
    key: 'reconnect',
    value: function reconnect() {
      return this.connector.reconnect();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.disconnect();
      this.db.destroy();
      this.connector = null;
      this.db = null;
    }
  }]);

  return YConfig;
})();

if (typeof window !== 'undefined') {
  window.Y = Y;
}

},{"./Connector.js":3,"./Connectors/Test.js":4,"./Database.js":5,"./Struct.js":6,"./Transaction.js":7,"./Types/Map.js":8,"./Utils.js":9}]},{},[2,10])

