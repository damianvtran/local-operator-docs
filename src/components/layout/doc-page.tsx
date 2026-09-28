import { CopyPageButton } from "@/components/docs/copy-page-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Pager } from "@/components/layout/pager";
import { TableOfContents } from "@/components/layout/table-of-contents";
import { getBreadcrumb, getPager, type LoadedPage } from "@/lib/content";
import { renderDoc } from "@/lib/markdoc-config";

/**
 * Renders one documentation page: breadcrumbs and page actions, the Markdoc
 * body inside the article grid, the pager, and the TOC rail beside it.
 *
 * The width budget is the bleed track + the TOC rail + the gap:
 * 58rem + 14rem + 2.5rem. Sized without the rail, the article could never
 * reach its own bleed width, because the TOC takes its space out of the
 * article's flex basis (measured in the radient rebuild).
 */
export function DocPage({ page }: { page: LoadedPage }) {
	const crumb = getBreadcrumb(page.slug);
	const { prev, next } = getPager(page.slug);

	return (
		<div className="mx-auto flex w-full max-w-[calc(58rem_+_14rem_+_2.5rem)] justify-center gap-10">
			<article className="docs-article min-w-0 flex-1 pb-4">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
					<Breadcrumbs group={crumb.group} title={crumb.title ?? page.title} />
					<CopyPageButton slug={page.slug} />
				</div>
				{renderDoc(page.ast)}
				<Pager prev={prev} next={next} />
			</article>
			<TableOfContents entries={page.toc} />
		</div>
	);
}
