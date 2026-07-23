cat > /tmp/commit-msg.txt << 'EOF'
fix(page): correct pathParams type constraints

PageProps<Path>["params"] is already Promise<ParamMap[Path]>, not the
resolved value. The pathParams addition wrapped it in an extra
Promise<...> when awaiting via Promise.all, producing
Promise<Promise<...>> that didn't match props.params' real runtime
type. Drop the extra wrap; use Awaited<PageProps<Path>["params"]>
only where the resolved value is actually stored (context values,
UsePageContextResult), and the raw promise type where one is
expected (getPathParams, EnhancedProps).

Separately, PageProps<Route> requires Route extends AppRoutes, but
every type carrying pathParams (InternalPageContextValue,
InternalPageFallbackContextValue, PageContextValue,
PageFallbackContextValue, UsePageContextResult, both context
providers) only constrained Path extends string, so indexing
PageProps<Path> failed to satisfy that constraint. Propagate Path
extends AppRoutes through all of them, and up to PageFn itself in
safe-page.tsx - its route parameter was R extends string, so
ExtractPagePath<P> couldn't produce a type that satisfied AppRoutes
downstream without infer R extends AppRoutes on the extraction.

Verified against a minimal repro of Next's typed-route ambient types
under --strict, including the exact usePage("registered-page") path
with a dynamic route segment.
EOF

git commit -F /tmp/commit-msg.txt
rm /tmp/commit-msg.txt