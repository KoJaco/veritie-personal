import { getNormalizedObjectStubs, getObjectStub } from "@/lib/stubs";
import type { ObjectStub } from "@/lib/stubs";

const INITIAL_OBJECT_COUNT = 40;

let records: ObjectStub[] | null = null;

function ensureStore() {
    if (records) {
        return;
    }

    const seededObjects = getNormalizedObjectStubs();
    const additionalCount = Math.max(
        0,
        INITIAL_OBJECT_COUNT - seededObjects.length,
    );
    const generatedObjects = Array.from({ length: additionalCount }, (_, index) =>
        getObjectStub({ id: `obj_seed_${index + 1}` }),
    );

    records = [...seededObjects, ...generatedObjects].sort(
        (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
    );
}

export function getStubObjectsIndex(): ObjectStub[] {
    ensureStore();
    return records!.map((item) => ({
        ...item,
        scopeIds: [...(item.scopeIds ?? [])],
    }));
}

export function resetStubObjectStoreForTests() {
    records = null;
}
