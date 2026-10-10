import { beforeEach, afterEach, expect, it, vi } from "vitest";
const effect = vi.hoisted(()=>({cleanup:undefined as undefined|(()=>void), recovered:null as null|{id:string;code:string;status:string;joinUrl:string}}));
// Hook harness exercises actual scheduling and request behavior; no browser/device claims.
vi.mock("react",()=>({useState:(initial:unknown)=>[initial===null?effect.recovered:initial,vi.fn()],useEffect:(callback:()=>undefined|(()=>void))=>{effect.cleanup=callback();}}));
import { RecoverRoom } from "../app/games/clear-the-stack/RecoverRoom";
const request=vi.fn();
beforeEach(()=>{vi.useFakeTimers();request.mockReset();request.mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',request);vi.stubGlobal('document',{visibilityState:'visible',addEventListener:vi.fn(),removeEventListener:vi.fn()});effect.recovered={id:'original-room',code:'ABC234',status:'playing',joinUrl:'https://example.test/games/clear-the-stack/join/ABC234'};effect.cleanup=undefined;});
afterEach(()=>{effect.cleanup?.();vi.unstubAllGlobals();vi.useRealTimers();});
it("continues authorized renewal beyond the recovery lease without another recovery POST",async()=>{
 RecoverRoom();await vi.advanceTimersByTimeAsync(25*60*60*1000);
 expect(request).toHaveBeenCalledTimes(301);
 for(const [url,options] of request.mock.calls){expect(url).toBe('/api/games/clear-the-stack/room');expect(options.method).toBe('PATCH');expect(JSON.parse(options.body)).toEqual({id:'original-room',status:'playing'});}
});
it.each([401,403,404])("stops renewal on authorization/eligibility status %s",async status=>{
 request.mockResolvedValue(new Response('{}',{status}));RecoverRoom();await vi.advanceTimersByTimeAsync(10*60*1000);expect(request).toHaveBeenCalledTimes(1);
});
it("does not keep abandoned background tabs alive, and cleans up on unmount",async()=>{
 Object.assign(document,{visibilityState:'hidden'});RecoverRoom();await vi.advanceTimersByTimeAsync(10*60*1000);expect(request).not.toHaveBeenCalled();
 Object.assign(document,{visibilityState:'visible'});await vi.advanceTimersByTimeAsync(5*60*1000);expect(request).toHaveBeenCalledTimes(1);effect.cleanup?.();await vi.advanceTimersByTimeAsync(10*60*1000);expect(request).toHaveBeenCalledTimes(1);
});
it.each(['open','closed'])("does not change recovered %s room status through heartbeat",async status=>{
 effect.recovered!.status=status;RecoverRoom();await vi.advanceTimersByTimeAsync(10*60*1000);expect(request).not.toHaveBeenCalled();
});
