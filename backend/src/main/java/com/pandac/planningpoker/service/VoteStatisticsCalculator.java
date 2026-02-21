package com.pandac.planningpoker.service;

import com.pandac.planningpoker.model.Vote;
import lombok.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Pure-function utility that computes all voting statistics from a list of {@link Vote}s.
 * Eliminates the duplicated calculation code in {@code PlanningPokerService.revealVotes()}
 * and {@code AnalyticsService.getStoryAnalytics()}.
 */
@Component
public class VoteStatisticsCalculator {

    /**
     * Compute statistics for the given votes.
     *
     * @param votes raw votes (may include non-numeric estimates like ?, ☕, ∞)
     * @return an immutable {@link VoteStatistics} result
     */
    public VoteStatistics calculate(List<Vote> votes) {
        if (votes == null || votes.isEmpty()) {
            return VoteStatistics.empty();
        }

        // Distribution of all estimates (including non-numeric)
        Map<String, Integer> distribution = new LinkedHashMap<>();
        List<Double> numericValues = new ArrayList<>();

        for (Vote v : votes) {
            distribution.merge(v.getEstimate(), 1, Integer::sum);
            try {
                numericValues.add(Double.parseDouble(v.getEstimate()));
            } catch (NumberFormatException ignored) {
                // Non-numeric estimate — excluded from numeric stats
            }
        }

        Collections.sort(numericValues);

        // Numeric stats
        Double average = null;
        String median = null;
        String mode = null;
        Double stdDeviation = null;

        if (!numericValues.isEmpty()) {
            average = numericValues.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

            int size = numericValues.size();
            double medianValue = (size % 2 == 0)
                    ? (numericValues.get(size / 2 - 1) + numericValues.get(size / 2)) / 2.0
                    : numericValues.get(size / 2);
            median = String.valueOf(medianValue);

            if (numericValues.size() > 1) {
                final double mean = average;
                double variance = numericValues.stream()
                        .mapToDouble(v -> Math.pow(v - mean, 2))
                        .average()
                        .orElse(0.0);
                stdDeviation = Math.sqrt(variance);
            }
        }

        // Mode from distribution (string-level, includes non-numeric)
        mode = distribution.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Consensus: all votes identical
        boolean consensus = distribution.size() == 1;

        return new VoteStatistics(distribution, average, median, mode, stdDeviation,
                numericValues, consensus);
    }

    // ── Result value object ────────────────────────────────────────────────────

    /**
     * Immutable statistics result.
     */
    @Value
    public static class VoteStatistics {

        /** Vote distribution: estimate → count (all estimates, including non-numeric). */
        Map<String, Integer> distribution;

        /** Average of numeric estimates; {@code null} if no numeric votes. */
        Double average;

        /**
         * Median of numeric estimates as a String (e.g. "5.0"); {@code null} if no numeric votes.
         */
        String median;

        /**
         * Most frequent estimate (mode); works on all estimates, not just numeric.
         * Use as recommended estimate.
         */
        String mode;

        /** Population standard deviation; {@code null} if fewer than 2 numeric votes. */
        Double stdDeviation;

        /** Sorted numeric estimate values (parsed from strings). */
        List<Double> numericValues;

        /** {@code true} when every voter chose the same estimate. */
        boolean consensus;

        /** Returns an empty result (zero votes). */
        static VoteStatistics empty() {
            return new VoteStatistics(
                    Collections.emptyMap(), null, null, null, null,
                    Collections.emptyList(), false);
        }
    }
}
