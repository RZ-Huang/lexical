/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {ScanningContext} from './utils';
import type {
  DecoratorNode,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  RootNode,
} from 'lexical';

import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
} from 'lexical';
import invariant from 'shared/invariant';

import {getAllMarkdownCriteria} from './autoFormatUtils';
import {
  getCodeBlockCriteria,
  getInitialScanningContext,
  getPatternMatchResultsForParagraphs,
  resetScanningContext,
  stringMatchesCodeBlock,
  transformTextNodeForParagraphs,
} from './utils';

export function convertStringToLexical(
  text: string,
  editor: LexicalEditor,
): null | RootNode {
  if (!text.length) {
    return null;
  }
  const nodes = [];
  const splitLines = text.split('\n');
  const splitLinesCount = splitLines.length;
  for (let i = 0; i < splitLinesCount; i++) {
    nodes.push($createParagraphNode().append($createTextNode(splitLines[i])));
  }
  if (nodes.length) {
    const root = $getRoot();
    root.clear();
    root.append(...nodes);
    return root;
  }
  return null;
}

function convertElementNodeContainingMarkdown<T>(
  scanningContext: ScanningContext,
  elementNode: ElementNode,
  createHorizontalRuleNode: null | (() => DecoratorNode<T>),
) {
  const textContent = elementNode.getTextContent();

  // Handle conversion to code block.
  if (
    scanningContext.isWithinCodeBlock === true &&
    stringMatchesCodeBlock(textContent)
  ) {
    // Transform to code block.
    scanningContext.markdownCriteria = getCodeBlockCriteria();

    // Perform text transformation here.
    transformTextNodeForParagraphs(scanningContext, createHorizontalRuleNode);
    return;
  }

  // Handle paragraph nodes below.
  if (
    $isParagraphNode(elementNode) &&
    textContent.length &&
    elementNode.getChildren().length
  ) {
    const paragraphNode: ParagraphNode = elementNode;
    const allCriteria = getAllMarkdownCriteria();
    const count = allCriteria.length;
    for (let i = 0; i < count; i++) {
      const criteria = allCriteria[i];
      if (criteria.requiresParagraphStart === true) {
        const firstChild = paragraphNode.getFirstChild();
        invariant(
          $isTextNode(firstChild),
          'Expect paragraph containing only text nodes.',
        );
        scanningContext.textNodeWithOffset = {
          node: firstChild,
          offset: 0,
        };
        scanningContext.joinedText = paragraphNode.getTextContent();

        const patternMatchResults = getPatternMatchResultsForParagraphs(
          criteria,
          scanningContext,
        );

        if (patternMatchResults != null) {
          // Lazy fill-in the particular format criteria and any matching result information.
          scanningContext.markdownCriteria = criteria;
          scanningContext.patternMatchResults = patternMatchResults;

          // Perform text transformation here.
          transformTextNodeForParagraphs(
            scanningContext,
            createHorizontalRuleNode,
          );
        }
      }
    }
  }
}

export function convertMarkdownForElementNodes<T>(
  editor: LexicalEditor,
  createHorizontalRuleNode: null | (() => DecoratorNode<T>),
) {
  // Please see the declaration of ScanningContext for a detailed explanation.
  const scanningContext = getInitialScanningContext(editor, false, null, null);

  const root = $getRoot();
  let done = false;
  let startIndex = 0;

  while (!done) {
    done = true;

    const elementNodes: Array<LexicalNode> = root.getChildren();
    const countOfElementNodes = elementNodes.length;

    for (let i = startIndex; i < countOfElementNodes; i++) {
      const elementNode = elementNodes[i];

      if ($isElementNode(elementNode)) {
        convertElementNodeContainingMarkdown(
          scanningContext,
          elementNode,
          createHorizontalRuleNode,
        );
      }
      // Reset the scanning information that relates to the particular element node.
      resetScanningContext(scanningContext);

      if (root.getChildren().length !== countOfElementNodes) {
        // The conversion added or removed an from root's children.
        startIndex = i;
        done = false;
        break;
      }
    }
  } // while
}
