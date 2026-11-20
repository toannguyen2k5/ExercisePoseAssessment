import json, os
import numpy as np

MODEL_DIR = r'd:\University_DUT\Semester7\Hoc_may_ung_dung\Project_CK\ExercisePoseAssessment\models\lstm'

# 1. Summary
summary_path = os.path.join(MODEL_DIR, 'model_summary.json')
if os.path.exists(summary_path):
    with open(summary_path) as f:
        s = json.load(f)
    print("=== MODEL SUMMARY ===")
    for k, v in s.items():
        if k != 'label_map':
            print(f"  {k}: {v}")

# 2. Training history
hist_path = os.path.join(MODEL_DIR, 'training_history.json')
if os.path.exists(hist_path):
    with open(hist_path) as f:
        hist = json.load(f)
    
    acc     = hist['accuracy']
    val_acc = hist['val_accuracy']
    loss    = hist['loss']
    val_loss= hist['val_loss']
    n_epochs = len(acc)
    
    print(f"\n=== TRAINING HISTORY ({n_epochs} epochs ran) ===")
    print(f"Final train acc    : {acc[-1]:.4f}")
    print(f"Final val acc      : {val_acc[-1]:.4f}")
    print(f"Best val acc       : {max(val_acc):.4f} @ epoch {val_acc.index(max(val_acc))+1}")
    print(f"Final train loss   : {loss[-1]:.4f}")
    print(f"Final val loss     : {val_loss[-1]:.4f}")
    
    # Gap analysis
    gap_acc  = [abs(a - v) for a, v in zip(acc, val_acc)]
    gap_loss = [abs(l - vl) for l, vl in zip(loss, val_loss)]
    print(f"\n=== OVERFIT ANALYSIS ===")
    print(f"Avg |train_acc - val_acc|   : {np.mean(gap_acc):.4f}")
    print(f"Max |train_acc - val_acc|   : {np.max(gap_acc):.4f}")
    print(f"Avg |train_loss - val_loss| : {np.mean(gap_loss):.4f}")
    print(f"Max |train_loss - val_loss| : {np.max(gap_loss):.4f}")
    
    # Early epochs vs late epochs
    if n_epochs >= 10:
        print(f"\nEpoch 1-5   val_acc: {np.mean(val_acc[:5]):.4f}")
        print(f"Epoch 6-10  val_acc: {np.mean(val_acc[5:10]):.4f}")
        if n_epochs > 10:
            print(f"Last 5 eps  val_acc: {np.mean(val_acc[-5:]):.4f}")
    
    # LR history if present
    if 'learning_rate' in hist:
        lr = hist['learning_rate']
        print(f"\nLR: start={lr[0]:.6f} → end={lr[-1]:.6f}")

# 3. CSV log
csv_path = os.path.join(MODEL_DIR, 'train_log.csv')
if os.path.exists(csv_path):
    print(f"\n=== FIRST & LAST 3 EPOCHS (from CSV) ===")
    with open(csv_path) as f:
        lines = f.readlines()
    header = lines[0].strip()
    print(header)
    for l in lines[1:4]: print(l.strip())
    print("...")
    for l in lines[-3:]: print(l.strip())

