"""RunPod serverless provider — nothing to own, nothing to reap.

A RunPod serverless *endpoint* is shared managed infrastructure that scales to zero
and bills per second. Multiple agents can hit the same endpoint id concurrently with
no lifecycle conflict — there is no per-agent instance to name, guard, or leak. So
this provider deliberately owns nothing and reaps nothing; it exists to make that
safety explicit and to keep serverless tools legible in `commons status`.

(Tools like Shop/Hero and Avatar Maker/regen_one.py already drive endpoints directly
and are inherently multi-agent-safe — they need no slug.)
"""
from ..provider import InstanceProvider, Resource


class RunpodServerlessProvider(InstanceProvider):
    name = "runpod_serverless"
    kind = "serverless_endpoint"

    def create(self, spec: dict) -> Resource:
        raise NotImplementedError(
            "serverless endpoints are shared infra — Commons does not provision or own them")

    def list_all(self) -> list[Resource]:
        return []          # no per-agent instances → nothing to attribute or reap

    def owns(self, r: Resource) -> bool:
        return False       # a shared endpoint is never owned by one agent

    def terminate(self, resource: Resource) -> bool:
        return False       # never terminate shared infra
