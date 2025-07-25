import { $fxy } from "../$wrap$/Symbol";

//
export const fixFx = (obj) => { if (typeof obj == "function" || obj == null) return obj; const fx = function(){}; fx[$fxy] = obj; return fx; }
export const $set = (rv, key, val)=>{ if (rv?.deref?.() != null) { return (rv.deref()[key] = val); }; }

//
const actWith = (promiseOrPlain, cb)=>{
    if (promiseOrPlain instanceof Promise || typeof promiseOrPlain?.then == "function") {
        if (resolvedMap?.has?.(promiseOrPlain)) { return cb(resolvedMap?.get?.(promiseOrPlain)); }
        // @ts-ignore
        return Promise.try?.(async ()=>{
            const item = await promiseOrPlain;
            resolvedMap?.set?.(promiseOrPlain, item);
            return item;
        })?.then?.(cb);
    }
    return cb(promiseOrPlain);
}

//
const unwrap = (obj)=>{
    return (obj?.[$fxy] ?? obj);
}

//
const promiseHandler = {
    defineProperty(target, prop, descriptor) {
        return actWith(unwrap(target), (obj)=>Reflect.defineProperty(obj, prop, descriptor));
    },
    deleteProperty(target, prop) {
        return actWith(unwrap(target), (obj)=>Reflect.deleteProperty(obj, prop));
    },
    getPrototypeOf(target) {
        return actWith(unwrap(target), (obj)=>Reflect.getPrototypeOf(obj));
    },
    setPrototypeOf(target, proto) {
        return actWith(unwrap(target), (obj)=>Reflect.setPrototypeOf(obj, proto));
    },
    isExtensible(target) {
        return actWith(unwrap(target), (obj)=>Reflect.isExtensible(obj));
    },
    preventExtensions(target) {
        return actWith(unwrap(target), (obj)=>Reflect.preventExtensions(obj));
    },
    ownKeys(target) {
        return actWith(unwrap(target), (obj)=>Reflect.ownKeys(obj));
    },
    getOwnPropertyDescriptor(target, prop) {
        return actWith(unwrap(target), (obj)=>Reflect.getOwnPropertyDescriptor(obj, prop));
    },
    construct(target, args, newTarget) {
        return actWith(unwrap(target), (ct)=>Reflect.construct(ct, args, newTarget));
    },
    get(target, prop, receiver) {
        target = unwrap(target);
        if (prop === 'then' || prop === 'catch' || prop === 'finally')
            { return target?.[prop]?.bind?.(target); }

         // @ts-ignore
        return Promised(actWith(target, async (obj)=>{
            let value: any = undefined;
            try { value = Reflect.get(obj, prop, receiver); } catch (e) { value = target?.[prop]; }
            if (typeof value == 'function') { return value?.bind?.(obj); }
            return value;
        }));
    },
    set(target, prop, value) {
        return actWith(unwrap(target), (obj)=>Reflect.set(obj, prop, value));
    },
    apply(target, thisArg, args) {
        return actWith(unwrap(target), (obj)=>Reflect.apply(obj, thisArg, args));
    }
}

//
const resolvedMap = new WeakMap(), handledMap = new WeakMap();

//
export function Promised(promise) {
    if (!handledMap?.has?.(promise)) { promise?.then?.((item)=>resolvedMap?.set?.(promise, item)); } // @ts-ignore
    return handledMap?.getOrInsertComputed?.(promise, ()=>new Proxy<any>(fixFx(promise), promiseHandler));
}
