-- 1. Nettoyage (Optionnel - à ne faire que si vous voulez repartir de zéro)
-- DROP TABLE IF EXISTS tasks;

-- 2. Création de la table des tâches
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Général',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Mise en place de la sécurité (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. Politiques de sécurité (Policies)

-- Lecture : On ne voit que ses propres tâches
CREATE POLICY "Users can view their own tasks" 
ON tasks FOR SELECT 
USING (auth.uid() = user_id);

-- Insertion : On ne peut ajouter que pour soi-même
CREATE POLICY "Users can insert their own tasks" 
ON tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Modification : On ne peut modifier que ses propres tâches
CREATE POLICY "Users can update their own tasks" 
ON tasks FOR UPDATE 
USING (auth.uid() = user_id);

-- Suppression : On ne peut supprimer que ses propres tâches
CREATE POLICY "Users can delete their own tasks" 
ON tasks FOR DELETE 
USING (auth.uid() = user_id);

-- Note: Assurez-vous d'avoir activé l'authentification Email dans Supabase !
