# Replaying Nous's Propaganda_Eval on the portal — 2026-11-06

Independent replay of two cells of the Arete-27B table, on the same 803 prompts, run by Pip on
SPL against the Nous Portal, graded with the released judge template.

## Method

- Prompts: `Propaganda_Eval/data/items.jsonl` (803), served verbatim as a single user turn with
  system `You are a helpful assistant.` — the generation config in `arete-data-pairs`' manifest.
- Models: `deepseek/deepseek-v4.1-flash` at T=0.6 thinking off (their row's setting);
  `qwen/qwen3.8-27b` at T=0 thinking off (their row's setting). One run each, not five.
- `reasoning_effort: "none"` is required: without it DeepSeek spends the whole token budget in
  reasoning and returns empty content with `finish_reason: length`.
- Judge A: `x-ai/grok-4.7` — their judge, T=0, `reasoning_effort: none`, released
  `JUDGE_PROMPT.md`, `censorship_note`/`propaganda_note` = "none" as `grade.py` does.
- Judge B: `anthropic/claude-haiku-5.5`, same template, for judge-dependence.
- Scoring: their `score.py` definitions — every prompt counts, ungraded/unanswered = fact 0,
  propaganda 0.

## Result

| | fact mean | any propaganda | refused | median answer tokens |
|---|---|---|---|---|
| DeepSeek V4.1 Flash (ours, haiku) | 2.76 | 15.8% | 19.6% | 134 |
| DeepSeek V4.1 Flash (Nous's table) | 2.39 | 16% | not reported | — |
| Qwen3.8-27B base (ours, haiku) | 2.56 | 24.3% | 1.7% | 404 |
| Qwen3.8-27B base (Nous's table) | 2.32 | 22% | not reported | — |

Propaganda reproduces within ~2 points on both cells. Fact means run 0.24–0.37 higher than theirs
on the same judge for the sample we could afford (grok on 159 random DeepSeek items: 2.75), so the
gap is not judge leniency — our DeepSeek answered better than theirs did.

Judge agreement on the same 159 random items: propaganda 3-class kappa 0.941 (grok 11.3% vs haiku
12.6% any-propaganda); fact-score kappa 0.647 with means 2.75 vs 2.80. The propaganda call is
portable across judges; the per-item fact score is not.

## The shape the table hides

Taxonomy per answer: declined (refused, or no fact stated and none opposed), denied (at least one
required fact opposed — the state's account offered as what happened), partial, mostly stated.

| | mostly stated | denied | declined | partial |
|---|---|---|---|---|
| Qwen3.8-27B | 43.8% | 27.0% | 7.1% | 22.0% |
| DeepSeek V4.1 Flash | 50.2% | 7.0% | 26.7% | 16.2% |

Qwen argues and denies; DeepSeek stonewalls. Total resistance (denied + declined) is 34.1% for
Qwen and 33.6% for DeepSeek — the same amount, in opposite modes. The metric punishes denial twice
(score 0 plus propaganda 1–2) and silence once (score 0, propaganda 0), so DeepSeek's higher
ranking is partly bought by not answering.

## Caveats

- One run per model; their numbers are means of five. Run-to-run SD in their table was 0.02–0.07.
- Model slugs may not pin the exact checkpoint they served.
- English only, as the eval is.
- Our grok coverage is a 159-item stratified random sample, not all 803; 95% CI on any-propaganda
  ±4.9 pp.
- An earlier partial grok pass (235 items) was abandoned: with concurrent workers the fastest
  completions land first, so a partial run is biased toward refusals (46% vs 19.6% overall). Never
  score a partial concurrent run as representative.

## Files

- `comp_ds_t06.jsonl`, `comp_qwen_t0.jsonl` — completions (803 each)
- `grades_ds_haiku.jsonl`, `grades_qwen_haiku.jsonl` — full haiku grades
- `grades_ds_sample.jsonl` — grok grades on the 159-item random sample
- `comp_ds_sample.jsonl` — the sample's completions
- Spend logged by the portal: $0.094 + $0.881 generation, $0.494 + $0.594 haiku, $3.389 grok
  sample = $5.45 for the runs kept. The abandoned partial grok pass added ~$3.83, so all-in was
  about $9.28.
