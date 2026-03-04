import { client } from '@/lib/basehub';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await client.query({
      documentation: {
        __args: {
          search: {
            q: query,
            by: ['_title', 'richText'],
          },
          first: 10,
        },
        items: {
          _id: true,
          _title: true,
          _slug: true,
          category: true,
          _highlight: {
            by: true,
            snippet: true,
          },
        },
      },
    });

    const results = data.documentation.items.map((item) => ({
      id: item._id,
      title: item._title,
      url: `/docs/${item._slug}`,
      category: item.category,
      highlight: item._highlight,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
