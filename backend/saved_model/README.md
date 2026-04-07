---
tags:
- sentence-transformers
- sentence-similarity
- feature-extraction
- dense
- generated_from_trainer
- dataset_size:12920
- loss:CosineSimilarityLoss
base_model: sentence-transformers/all-MiniLM-L6-v2
widget:
- source_sentence: recipe 132 rice cheese green chili salt rolled oats peanut butter
    cucumber banana vegetarian high-fiber high-protein low-fat muscle-gain
  sentences:
  - recipe 326 cumin seeds romaine lettuce rolled oats lentils moong dal tofu jain
    low-carb pescatarian high-protein high-fiber diabetes-friendly maintenance
  - recipe 312 yogurt salt oil rice lentils chicken breast beans halal low-calorie
    high-fiber maintenance muscle-gain
  - recipe 326 cumin seeds romaine lettuce rolled oats lentils moong dal tofu jain
    low-carb pescatarian high-protein high-fiber diabetes-friendly maintenance
- source_sentence: recipe 45 tofu peanut butter garlic spinach potato halal omnivore
    jain low-calorie high-fiber
  sentences:
  - recipe 400 tomato moong dal lentils spinach rice oil milk carrot low-fat diabetes-friendly
    high-fiber improve-stamina bulking
  - recipe 493 cheese lemon juice banana yogurt spinach vegan vegetarian keto heart-healthy
    improve-stamina
  - recipe 451 mushroom chicken breast carrot potato milk cheese green chili keto
    vegetarian halal gut-health diabetes-friendly improve-stamina maintenance
- source_sentence: recipe 16 peanut butter soy sauce mushroom ginger keto high-fiber
    gut-health heart-healthy cutting
  sentences:
  - recipe 170 olive oil chicken breast rice oil gut-health cutting
  - recipe 386 milk lentils potato onion vegan high-protein low-calorie cutting weight-loss
  - recipe 136 yogurt garlic oil lentils onion potato moong dal mushroom keto high-protein
    low-fat muscle-gain
- source_sentence: recipe 61 lemon juice salt beans spinach moong dal jain low-carb
    heart-healthy gut-health low-fat
  sentences:
  - recipe 326 cumin seeds romaine lettuce rolled oats lentils moong dal tofu jain
    low-carb pescatarian high-protein high-fiber diabetes-friendly maintenance
  - recipe 458 soy sauce green chili beans spinach diabetes-friendly heart-healthy
    improve-stamina
  - recipe 414 rice carrot tomato olive oil ginger cucumber lentils peanut butter
    romaine lettuce halal vegan low-carb low-calorie low-fat cutting
- source_sentence: recipe 91 cheese carrot banana romaine lettuce green chili lemon
    juice rolled oats diabetes-friendly gut-health heart-healthy bulking
  sentences:
  - recipe 133 cucumber potato milk moong dal lemon juice rice turmeric peanut butter
    omnivore heart-healthy low-fat diabetes-friendly muscle-gain bulking
  - recipe 356 romaine lettuce salt soy sauce cheese vegetarian high-protein low-fat
    heart-healthy
  - recipe 294 lentils spinach rolled oats moong dal cumin seeds peanut butter turmeric
    gluten-free vegan low-carb gut-health high-fiber cutting maintenance
pipeline_tag: sentence-similarity
library_name: sentence-transformers
---

# SentenceTransformer based on sentence-transformers/all-MiniLM-L6-v2

This is a [sentence-transformers](https://www.SBERT.net) model finetuned from [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). It maps sentences & paragraphs to a 384-dimensional dense vector space and can be used for semantic textual similarity, semantic search, paraphrase mining, text classification, clustering, and more.

## Model Details

### Model Description
- **Model Type:** Sentence Transformer
- **Base model:** [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) <!-- at revision c9745ed1d9f207416be6d2e6f8de32d1f16199bf -->
- **Maximum Sequence Length:** 256 tokens
- **Output Dimensionality:** 384 dimensions
- **Similarity Function:** Cosine Similarity
<!-- - **Training Dataset:** Unknown -->
<!-- - **Language:** Unknown -->
<!-- - **License:** Unknown -->

### Model Sources

- **Documentation:** [Sentence Transformers Documentation](https://sbert.net)
- **Repository:** [Sentence Transformers on GitHub](https://github.com/huggingface/sentence-transformers)
- **Hugging Face:** [Sentence Transformers on Hugging Face](https://huggingface.co/models?library=sentence-transformers)

### Full Model Architecture

```
SentenceTransformer(
  (0): Transformer({'max_seq_length': 256, 'do_lower_case': False, 'architecture': 'BertModel'})
  (1): Pooling({'word_embedding_dimension': 384, 'pooling_mode_cls_token': False, 'pooling_mode_mean_tokens': True, 'pooling_mode_max_tokens': False, 'pooling_mode_mean_sqrt_len_tokens': False, 'pooling_mode_weightedmean_tokens': False, 'pooling_mode_lasttoken': False, 'include_prompt': True})
  (2): Normalize()
)
```

## Usage

### Direct Usage (Sentence Transformers)

First install the Sentence Transformers library:

```bash
pip install -U sentence-transformers
```

Then you can load this model and run inference.
```python
from sentence_transformers import SentenceTransformer

# Download from the 🤗 Hub
model = SentenceTransformer("sentence_transformers_model_id")
# Run inference
sentences = [
    'recipe 91 cheese carrot banana romaine lettuce green chili lemon juice rolled oats diabetes-friendly gut-health heart-healthy bulking',
    'recipe 294 lentils spinach rolled oats moong dal cumin seeds peanut butter turmeric gluten-free vegan low-carb gut-health high-fiber cutting maintenance',
    'recipe 133 cucumber potato milk moong dal lemon juice rice turmeric peanut butter omnivore heart-healthy low-fat diabetes-friendly muscle-gain bulking',
]
embeddings = model.encode(sentences)
print(embeddings.shape)
# [3, 384]

# Get the similarity scores for the embeddings
similarities = model.similarity(embeddings, embeddings)
print(similarities)
# tensor([[1.0000, 0.7158, 0.8298],
#         [0.7158, 1.0000, 0.5045],
#         [0.8298, 0.5045, 1.0000]])
```

<!--
### Direct Usage (Transformers)

<details><summary>Click to see the direct usage in Transformers</summary>

</details>
-->

<!--
### Downstream Usage (Sentence Transformers)

You can finetune this model on your own dataset.

<details><summary>Click to expand</summary>

</details>
-->

<!--
### Out-of-Scope Use

*List how the model may foreseeably be misused and address what users ought not to do with the model.*
-->

<!--
## Bias, Risks and Limitations

*What are the known or foreseeable issues stemming from this model? You could also flag here known failure cases or weaknesses of the model.*
-->

<!--
### Recommendations

*What are recommendations with respect to the foreseeable issues? For example, filtering explicit content.*
-->

## Training Details

### Training Dataset

#### Unnamed Dataset

* Size: 12,920 training samples
* Columns: <code>sentence_0</code>, <code>sentence_1</code>, and <code>label</code>
* Approximate statistics based on the first 1000 samples:
  |         | sentence_0                                                                         | sentence_1                                                                        | label                                                         |
  |:--------|:-----------------------------------------------------------------------------------|:----------------------------------------------------------------------------------|:--------------------------------------------------------------|
  | type    | string                                                                             | string                                                                            | float                                                         |
  | details | <ul><li>min: 10 tokens</li><li>mean: 30.17 tokens</li><li>max: 46 tokens</li></ul> | <ul><li>min: 10 tokens</li><li>mean: 29.7 tokens</li><li>max: 46 tokens</li></ul> | <ul><li>min: 0.1</li><li>mean: 0.7</li><li>max: 0.9</li></ul> |
* Samples:
  | sentence_0                                                                                                                    | sentence_1                                                                                                                                                | label             |
  |:------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------|:------------------|
  | <code>recipe 367 banana romaine lettuce spinach beans onion jain vegetarian vegan gut-health heart-healthy pre-workout</code> | <code>recipe 486 banana lentils broccoli green chili beans turmeric cheese chicken breast moong dal heart-healthy diabetes-friendly cutting</code>        | <code>0.75</code> |
  | <code>recipe 66 soy sauce onion romaine lettuce olive oil mushroom banana vegan jain keto low-fat weight-loss</code>          | <code>recipe 149 salt tomato green chili spinach onion vegan cutting bulking</code>                                                                       | <code>0.1</code>  |
  | <code>recipe 140 garlic potato tofu salt turmeric spinach pescatarian halal low-fat high-fiber</code>                         | <code>recipe 208 lemon juice mushroom yogurt lentils romaine lettuce green chili salt moong dal oil vegetarian keto low-carb low-fat heart-healthy</code> | <code>0.75</code> |
* Loss: [<code>CosineSimilarityLoss</code>](https://sbert.net/docs/package_reference/sentence_transformer/losses.html#cosinesimilarityloss) with these parameters:
  ```json
  {
      "loss_fct": "torch.nn.modules.loss.MSELoss"
  }
  ```

### Training Hyperparameters
#### Non-Default Hyperparameters

- `per_device_train_batch_size`: 16
- `per_device_eval_batch_size`: 16
- `multi_dataset_batch_sampler`: round_robin

#### All Hyperparameters
<details><summary>Click to expand</summary>

- `per_device_train_batch_size`: 16
- `num_train_epochs`: 3
- `max_steps`: -1
- `learning_rate`: 5e-05
- `lr_scheduler_type`: linear
- `lr_scheduler_kwargs`: None
- `warmup_steps`: 0
- `optim`: adamw_torch_fused
- `optim_args`: None
- `weight_decay`: 0.0
- `adam_beta1`: 0.9
- `adam_beta2`: 0.999
- `adam_epsilon`: 1e-08
- `optim_target_modules`: None
- `gradient_accumulation_steps`: 1
- `average_tokens_across_devices`: True
- `max_grad_norm`: 1
- `label_smoothing_factor`: 0.0
- `bf16`: False
- `fp16`: False
- `bf16_full_eval`: False
- `fp16_full_eval`: False
- `tf32`: None
- `gradient_checkpointing`: False
- `gradient_checkpointing_kwargs`: None
- `torch_compile`: False
- `torch_compile_backend`: None
- `torch_compile_mode`: None
- `use_liger_kernel`: False
- `liger_kernel_config`: None
- `use_cache`: False
- `neftune_noise_alpha`: None
- `torch_empty_cache_steps`: None
- `auto_find_batch_size`: False
- `log_on_each_node`: True
- `logging_nan_inf_filter`: True
- `include_num_input_tokens_seen`: no
- `log_level`: passive
- `log_level_replica`: warning
- `disable_tqdm`: False
- `project`: huggingface
- `trackio_space_id`: trackio
- `eval_strategy`: no
- `per_device_eval_batch_size`: 16
- `prediction_loss_only`: True
- `eval_on_start`: False
- `eval_do_concat_batches`: True
- `eval_use_gather_object`: False
- `eval_accumulation_steps`: None
- `include_for_metrics`: []
- `batch_eval_metrics`: False
- `save_only_model`: False
- `save_on_each_node`: False
- `enable_jit_checkpoint`: False
- `push_to_hub`: False
- `hub_private_repo`: None
- `hub_model_id`: None
- `hub_strategy`: every_save
- `hub_always_push`: False
- `hub_revision`: None
- `load_best_model_at_end`: False
- `ignore_data_skip`: False
- `restore_callback_states_from_checkpoint`: False
- `full_determinism`: False
- `seed`: 42
- `data_seed`: None
- `use_cpu`: False
- `accelerator_config`: {'split_batches': False, 'dispatch_batches': None, 'even_batches': True, 'use_seedable_sampler': True, 'non_blocking': False, 'gradient_accumulation_kwargs': None}
- `parallelism_config`: None
- `dataloader_drop_last`: False
- `dataloader_num_workers`: 0
- `dataloader_pin_memory`: True
- `dataloader_persistent_workers`: False
- `dataloader_prefetch_factor`: None
- `remove_unused_columns`: True
- `label_names`: None
- `train_sampling_strategy`: random
- `length_column_name`: length
- `ddp_find_unused_parameters`: None
- `ddp_bucket_cap_mb`: None
- `ddp_broadcast_buffers`: False
- `ddp_backend`: None
- `ddp_timeout`: 1800
- `fsdp`: []
- `fsdp_config`: {'min_num_params': 0, 'xla': False, 'xla_fsdp_v2': False, 'xla_fsdp_grad_ckpt': False}
- `deepspeed`: None
- `debug`: []
- `skip_memory_metrics`: True
- `do_predict`: False
- `resume_from_checkpoint`: None
- `warmup_ratio`: None
- `local_rank`: -1
- `prompts`: None
- `batch_sampler`: batch_sampler
- `multi_dataset_batch_sampler`: round_robin
- `router_mapping`: {}
- `learning_rate_mapping`: {}

</details>

### Training Logs
| Epoch  | Step | Training Loss |
|:------:|:----:|:-------------:|
| 0.6188 | 500  | 0.0143        |
| 1.2376 | 1000 | 0.0101        |
| 1.8564 | 1500 | 0.0094        |
| 2.4752 | 2000 | 0.0098        |


### Framework Versions
- Python: 3.14.3
- Sentence Transformers: 5.2.3
- Transformers: 5.3.0
- PyTorch: 2.10.0+cpu
- Accelerate: 1.13.0
- Datasets: 4.6.1
- Tokenizers: 0.22.2

## Citation

### BibTeX

#### Sentence Transformers
```bibtex
@inproceedings{reimers-2019-sentence-bert,
    title = "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks",
    author = "Reimers, Nils and Gurevych, Iryna",
    booktitle = "Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing",
    month = "11",
    year = "2019",
    publisher = "Association for Computational Linguistics",
    url = "https://arxiv.org/abs/1908.10084",
}
```

<!--
## Glossary

*Clearly define terms in order to be accessible across audiences.*
-->

<!--
## Model Card Authors

*Lists the people who create the model card, providing recognition and accountability for the detailed work that goes into its construction.*
-->

<!--
## Model Card Contact

*Provides a way for people who have updates to the Model Card, suggestions, or questions, to contact the Model Card authors.*
-->