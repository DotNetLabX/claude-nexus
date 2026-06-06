# domain-patterns — Changelog

## [Unreleased]
- Added "When to Use a Value Object vs a Flat Scalar" subsection (ADR-007 gap — adhoc-Pass1-SkillRepair)
- Annotated IDomainEventPublisher section: labelled Blocks.MediatR path as full-stack variant, added Blocks.FastEndpoints light-stack variant (ADR-004/011)
- Annotated State Machine Pattern section: labelled Application/StateMachines/ as full-stack location, added light-stack (no Application layer) placement guidance
- Added "not proven until Passes 2/3 consume it" note

## [1.0.0] — 2026-05-24
- Baseline version — AggregateRoot, Entity, ValueObject base types, partial class split, domain events, event dispatch, IDomainEventPublisher variants, state machine pattern
