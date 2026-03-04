import { client } from './basehub';

export interface DocItem {
  _id: string;
  _title: string;
  _slug: string;
  category?: string;
}

export async function getDocumentation() {
  try {
    const data = await client.query({
      documentation: {
        items: {
          _id: true,
          _title: true,
          _slug: true,
          category: true,
          richText: {
            json: {
              content: true,
            },
          },
        },
      },
    });

    return data.documentation.items;
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return [];
  }
}

export async function getDocBySlug(slug: string) {
  try {
    const data = await client.query({
      documentation: {
        __args: {
          filter: {
            _sys_slug: {
              eq: slug,
            },
          },
          first: 1,
        },
        items: {
          _id: true,
          _title: true,
          _slug: true,
          category: true,
          richText: {
            json: {
              content: true,
            },
          },
        },
      },
    });

    return data.documentation.items[0] || null;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}
