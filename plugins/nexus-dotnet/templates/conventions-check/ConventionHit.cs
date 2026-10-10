namespace ConventionsCheck;

public record ConventionHit(string Check, string File, int Line, string Message);
