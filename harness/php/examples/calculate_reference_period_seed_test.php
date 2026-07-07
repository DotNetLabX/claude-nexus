<?php

declare(strict_types=1);

// Seed test — the PROVEN PATTERN the Cover agent mirrors (cpp examples/hungarian_smoke_test.cpp analogue).
// PHPUnit 12 class style: `final class XTest extends TestCase`, one test method per rule boundary,
// assert on execute()'s returned array. This shape runs under Pest's PHPUnit-compatibility layer in the
// consuming repo. Structural-invariant assertions are the Cover agent's job (see cover-php-contract.md);
// this seed pins two trivially-traceable cases so the probe has a green suite to mutate against.

namespace Tests;

use App\Actions\CalculateReferencePeriodAction;
use PHPUnit\Framework\TestCase;

final class CalculateReferencePeriodActionSeedTest extends TestCase
{
    public function testFullWeekShiftsBackOneWeek(): void
    {
        $action = new CalculateReferencePeriodAction();
        // Monday 2024-01-08 .. Sunday 2024-01-14 is a full ISO week -> the previous full week.
        $result = $action->execute('2024-01-08', '2024-01-14');

        self::assertSame('2024-01-01', $result['from']);
        self::assertSame('2024-01-07', $result['to']);
    }

    public function testArbitraryRangeShiftsBackByItsOwnLength(): void
    {
        $action = new CalculateReferencePeriodAction();
        // 2024-03-10 .. 2024-03-12 is a 3-day range (no full-period match) -> the 3 days immediately before.
        $result = $action->execute('2024-03-10', '2024-03-12');

        self::assertSame('2024-03-07', $result['from']);
        self::assertSame('2024-03-09', $result['to']);
    }
}
