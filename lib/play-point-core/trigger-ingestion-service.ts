import type {
  NotificationPublisher,
  PlayPointContest,
  PlayPointRepository,
  PlayPointTrigger,
  TriggerIngestionService,
  TriggerPolicy,
} from "./runtime-contracts";

interface TriggerPolicySelector {
  get(contest: PlayPointContest): TriggerPolicy | undefined;
}

export class StaticTriggerPolicySelector implements TriggerPolicySelector {
  private readonly policiesByFormat = new Map<
    PlayPointContest["formatKey"],
    TriggerPolicy
  >();

  constructor(entries: Array<[PlayPointContest["formatKey"], TriggerPolicy]>) {
    for (const [formatKey, policy] of entries) {
      this.policiesByFormat.set(formatKey, policy);
    }
  }

  get(contest: PlayPointContest): TriggerPolicy | undefined {
    return this.policiesByFormat.get(contest.formatKey);
  }
}

function collectShapeErrors(trigger: PlayPointTrigger): string[] {
  const errors: string[] = [];

  if (!trigger.id.trim()) {
    errors.push("Trigger id is required.");
  }

  if (!trigger.eventId.trim()) {
    errors.push("Event id is required.");
  }

  if (!trigger.triggerType.trim()) {
    errors.push("Trigger type is required.");
  }

  if (!trigger.idempotencyKey.trim()) {
    errors.push("Idempotency key is required.");
  }

  if (Number.isNaN(Date.parse(trigger.occurredAt))) {
    errors.push("Trigger occurredAt must be a valid ISO timestamp.");
  }

  return errors;
}

export class CoreTriggerIngestionService implements TriggerIngestionService {
  constructor(
    private readonly repository: PlayPointRepository,
    private readonly policies?: TriggerPolicySelector,
    private readonly notifications?: NotificationPublisher,
  ) {}

  async acceptTrigger(args: {
    trigger: PlayPointTrigger;
  }): Promise<{
    trigger: PlayPointTrigger;
    accepted: boolean;
    errors: string[];
  }> {
    const shapeErrors = collectShapeErrors(args.trigger);

    if (shapeErrors.length > 0) {
      return {
        trigger: {
          ...args.trigger,
          status: "rejected",
        },
        accepted: false,
        errors: shapeErrors,
      };
    }

    const duplicate = await this.repository.getTriggerByIdempotencyKey(
      args.trigger.idempotencyKey,
    );

    if (duplicate) {
      return {
        trigger: duplicate,
        accepted: true,
        errors: [],
      };
    }

    const errors: string[] = [];
    const event = await this.repository.getEvent(args.trigger.eventId);

    if (!event) {
      errors.push(`Event "${args.trigger.eventId}" was not found.`);
    }

    let acceptedTrigger = {
      ...args.trigger,
      status: "accepted" as const,
    };

    if (args.trigger.contestId) {
      const contest = await this.repository.getContest(args.trigger.contestId);

      if (!contest) {
        errors.push(`Contest "${args.trigger.contestId}" was not found.`);
      } else {
        if (contest.eventId !== args.trigger.eventId) {
          errors.push(
            `Contest "${contest.id}" does not belong to event "${args.trigger.eventId}".`,
          );
        }

        const policy = this.policies?.get(contest);

        if (policy) {
          const result = policy.validate(contest, acceptedTrigger);
          errors.push(...result.errors);

          if (result.normalizedPayload) {
            acceptedTrigger = {
              ...acceptedTrigger,
              payload: result.normalizedPayload,
            };
          }
        }
      }
    }

    if (errors.length > 0) {
      return {
        trigger: {
          ...acceptedTrigger,
          status: "rejected",
        },
        accepted: false,
        errors,
      };
    }

    await this.repository.saveTrigger(acceptedTrigger);

    if (this.notifications) {
      await this.notifications.publish([
        {
          type: "trigger.accepted",
          aggregateId: acceptedTrigger.id,
          occurredAt: new Date().toISOString(),
          payload: {
            eventId: acceptedTrigger.eventId,
            contestId: acceptedTrigger.contestId ?? null,
            triggerType: acceptedTrigger.triggerType,
          },
        },
      ]);
    }

    return {
      trigger: acceptedTrigger,
      accepted: true,
      errors: [],
    };
  }
}
