/**
 * This class implements a simple general-purpose stack using lists.
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Stack {
        constructor() {
            this.list = [];
        }
        push(obj) {
            this.list.push(obj);
        }
        pop() {
            if (this.list.length == 0) {
                throw new Error("Stack is empty: nothing to pop");
            }
            return this.list.pop();
        }
        peek() {
            if (this.list.length == 0) {
                throw new Error("Stack is empty: nothing to peek");
            }
            return this.list[this.list.length - 1];
        }
        isEmpty() {
            return this.list.length == 0;
        }
    }
    exports.Stack = Stack;
});
//# sourceMappingURL=Stack.js.map