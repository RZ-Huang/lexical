/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {redo, undo} from '../keyboardShortcuts/index.mjs';
import {
  assertHTML,
  focusEditor,
  html,
  initialize,
  test,
} from '../utils/index.mjs';

test.describe('Markdown', () => {
  test.beforeEach(({isCollab, page}) => initialize({isCollab, page}));

  const BASE_BLOCK_SHORTCUTS = [
    {
      html: html`
        <h1><br /></h1>
      `,
      text: '# ',
    },
    {
      html: html`
        <h2><br /></h2>
      `,
      text: '## ',
    },
    {
      html: html`
        <ol>
          <li value="1"><br /></li>
        </ol>
      `,
      text: '1. ',
    },
    {
      html: html`
        <ol start="25">
          <li value="25"><br /></li>
        </ol>
      `,
      text: '25. ',
    },
    {
      html: html`
        <ol>
          <li value="1">
            <ol>
              <li value="1"><br /></li>
            </ol>
          </li>
        </ol>
      `,
      text: '    1. ',
    },
    {
      html: html`
        <ul>
          <li value="1"><br /></li>
        </ul>
      `,
      text: '- ',
    },
    {
      html: html`
        <ul>
          <li value="1">
            <ul>
              <li value="1"><br /></li>
            </ul>
          </li>
        </ul>
      `,
      text: '    - ',
    },
    {
      html: html`
        <ul>
          <li value="1"><br /></li>
        </ul>
      `,
      text: '* ',
    },
    {
      html: html`
        <ul>
          <li value="1">
            <ul>
              <li value="1"><br /></li>
            </ul>
          </li>
        </ul>
      `,
      text: '    * ',
    },
    {
      html: html`
        <ul>
          <li value="1">
            <ul>
              <li value="1"><br /></li>
            </ul>
          </li>
        </ul>
      `,
      text: '      * ',
    },
    {
      html: html`
        <ul>
          <li value="1">
            <ul>
              <li value="1">
                <ul>
                  <li value="1">
                    <br />
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `,
      text: '        * ',
    },
    {
      html: html`
        <div
          contenteditable="false"
          style="display: contents;"
          data-lexical-decorator="true">
          <hr />
        </div>
        <p><br /></p>
      `,
      text: '--- ',
    },
    {
      html: html`
        <div
          contenteditable="false"
          style="display: contents;"
          data-lexical-decorator="true">
          <hr />
        </div>
        <p><br /></p>
      `,
      text: '*** ',
    },
  ];

  BASE_BLOCK_SHORTCUTS.forEach((testCase) => {
    test(`can convert "${testCase.text}" shortcut`, async ({
      page,
      isCollab,
    }) => {
      await focusEditor(page);
      await page.keyboard.type(testCase.text);
      await assertHTML(page, testCase.html, {ignoreClasses: true});

      // TODO:
      // Do we need undo for each test? Can do few targeted steps instead to speed it up
      if (!isCollab) {
        const escapedText = testCase.text.replace('>', '&gt;');
        await undo(page);
        await assertHTML(
          page,
          `<p><span data-lexical-text="true">${escapedText}</span></p>`,
          {ignoreClasses: true},
        );
        await redo(page);
        await assertHTML(page, testCase.html, {ignoreClasses: true});
      }
    });
  });

  const TEXT_FORMAT_SHORTCUTS = [
    {
      html: html`
        <p
          class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr"
          dir="ltr">
          <span data-lexical-text="true">hello</span>
          <em
            class="PlaygroundEditorTheme__textItalic"
            data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: 'hello *world* !',
    },
    {
      html: html`
        <p
          class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr"
          dir="ltr">
          <span data-lexical-text="true">hello</span>
          <strong
            class="PlaygroundEditorTheme__textBold"
            data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: 'hello **world** !',
    },
    {
      html: html`
        <p
          class="PlaygroundEditorTheme__paragraph PlaygroundEditorTheme__ltr"
          dir="ltr">
          <span data-lexical-text="true">hello</span>
          <strong
            class="PlaygroundEditorTheme__textBold PlaygroundEditorTheme__textItalic"
            data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: 'hello ***world*** !',
    },
  ];

  TEXT_FORMAT_SHORTCUTS.forEach((testCase) => {
    test(`can convert "${testCase.text}" shortcut`, async ({
      page,
      isCollab,
    }) => {
      await focusEditor(page);
      await page.keyboard.type(testCase.text);
      await assertHTML(page, testCase.html, {ignoreClasses: false});
    });
  });
});
